const SERVICE_UUID = '0000abcd-0000-1000-8000-00805f9b34fb';
const PUBLIC_CHAR_UUID = '00001234-0000-1000-8000-00805f9b34fb';

// Manage the installation prompt
let deferredPrompt: any;
const addBtn = document.createElement('button');
addBtn.textContent = 'Install App';
addBtn.style.display = 'none';
document.body.appendChild(addBtn);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    addBtn.style.display = 'block';

    addBtn.addEventListener('click', (e) => {
        addBtn.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });
});
///////////////////////


interface MessageBase {
    type: string;
    sourceAddress: string;
    destinationAddress: string;
    requestUUID: string;
}

interface AccessOnOff extends MessageBase {
    list: { [mac: string]: boolean };
}

interface AccessOnOFFSingle extends MessageBase {
    pair: { [mac: string]: boolean };
}

interface GetDeviceList extends MessageBase {}

interface ResOk extends MessageBase {
    status: boolean;
}

interface ScanWiFi extends MessageBase {}

interface ScanWiFiResult extends MessageBase {
//    list: { [ssid: string]: boolean };
    list: Record<string, boolean>;
}

interface LoginWWiFi extends MessageBase {
    ssid: string;
    pass: string;
}

interface GetWiFiStatus extends MessageBase {}

const scanButton = document.getElementById('scan-button')!;
const deviceList = document.getElementById('device-list')!;
const controlList = document.getElementById('control-list')!;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const cmpUUD = (a: string, b: string) => a.replace(/[^a-zA-Z0-9 ]/g, "") === b.replace(/[^a-zA-Z0-9 ]/g, "");

let bleDevice : BluetoothDevice | null | undefined  = null;
let uniqueCharacteristic : BluetoothRemoteGATTCharacteristic | null | undefined  = null;

document.getElementById("scan-button")?.addEventListener("click", async () => {
    try {
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });
        await connectToDevice(bleDevice);
    } catch (error) {
        console.error("BLE Scan failed:", error);
    }
});


/*scanButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
        console.error('Web Bluetooth API is not available in this browser.');
        return;
    }

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }],
            optionalServices: [SERVICE_UUID]
        });

        displayDeviceList(device);
    } catch (error) {
        console.error('Error:', error);
    }
})*/;

function displayDeviceList(device: BluetoothDevice) {
    deviceList.innerHTML = '';
    const listItem = document.createElement('li');
    listItem.textContent = device.name || device.id;
    listItem.addEventListener('click', () => connectToDevice(device));
    deviceList.appendChild(listItem);
}

async function connectToDevice(device: BluetoothDevice) {
    let retryCount = 0;
    const maxRetries = 6;
    let connected = false;

    while (!connected && retryCount < maxRetries) {
        try {
            console.log('Connecting to device:', device);
            const server = await device.gatt!.connect();

            if (!server) {
                throw new Error('Unable to connect to GATT server');
            }

            console.log('Connected to GATT server:', server);
	    console.log('is Connected = ', server.connected );

            const services = await server.getPrimaryServices();
            console.log ('Services...', services);
            console.log('Found services:', services.map(service => service.uuid));

            let publicService = services.find(service => cmpUUD(service.uuid, SERVICE_UUID));

            if (!publicService) {
                throw new Error('Public service not found');
            }

            console.log('Found public service:', publicService);

            const characteristics = await publicService.getCharacteristics();
            console.log('Found characteristics:', characteristics.map(char => char.uuid));

            let publicCharacteristic = characteristics.find(characteristic => cmpUUD(characteristic.uuid, PUBLIC_CHAR_UUID));

            if (!publicCharacteristic) {
                throw new Error('Public characteristic not found');
            }

            console.log('Found public characteristic:', publicCharacteristic);

            const value = await publicCharacteristic.readValue();
            const decoder = new TextDecoder('utf-8');
            const data = decoder.decode(value);

            console.log('Public characteristic value:', data);

            uniqueCharacteristic = characteristics.find(char => cmpUUD(char.uuid, data));
            if (uniqueCharacteristic) {
                uniqueCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
                await uniqueCharacteristic.startNotifications();
	        console.log('Found unique characteristic');
            }
	    else
	    {
		throw new Error ('Unique characteristic not found');
	    }

            if (uniqueCharacteristic) {
                const getMacList: GetDeviceList = {
                    type: 'GetDeviceList',
                    sourceAddress: '00:00:00:00:00:00',
                    destinationAddress: "BleLock",//device.name,//id,
                    requestUUID: 'M1'
                };
                //await 
                sendMessage(uniqueCharacteristic, getMacList);
            }

            connected = true;
        } catch (error) {
            retryCount++;
            console.error(`Error: ${error}. Retry ${retryCount}/${maxRetries}`);
            await wait(1000); // Wait 1 second before retrying
        }
    }

    if (!connected) {
        console.error('Failed to connect to device after multiple attempts');
    }
}

let destAdr = '';
let srcAdr = '';
let receivedData = '';

let isResCheckBox = false;
let chkOn = false;

function sendScanWiFiMessage() {
    if (uniqueCharacteristic) {
        const scanMessage: ScanWiFi = {
            type: "ScanWiFi",
            sourceAddress: destAdr, //"00:00:00:00:00:00",
            destinationAddress: srcAdr,//bleDevice?.name || "unknown",
            requestUUID: "M3"
        };
        sendMessage(uniqueCharacteristic, scanMessage);
    }
}

let needScanWiFi = false;

function handleNotifications(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(value!);

    receivedData += data;
    console.log('handleNotifications');
    console.log(receivedData);

    try {
	chkOn = true;
        //const message: AccessOnOff = JSON.parse(receivedData);
        const message = JSON.parse(receivedData);
        if (message.type === 'AccessOnOff') {
            displayControlList(message.list);
            receivedData = ''; // Reset buffer
	    console.log('on of parsed');
	    destAdr = message.sourceAddress;
	    srcAdr = message.destinationAddress;
	    console.log (message);
	    needScanWiFi = true;
	    //sendScanWiFiMessage ();
        } else if (message.type === "ScanWiFiResult") {
            receivedData = ''; // Reset buffer
	    updateNetworkList(message.list);
	} else if (message.type === "ResOk") {
            receivedData = ''; // Reset buffer
	    if (isResCheckBox)
	    {
		isResCheckBox = false;
		showConnectionStatus(message.status);
	    }
	}
	else
	            receivedData = ''; // Reset buffer

    } catch (e) {
        // Not a complete JSON message yet
	    console.log('on of parse error!');
    }
}

function displayControlList(devices: { [mac: string]: boolean }) {
    controlList.innerHTML = '';
    for (const [mac, isEnabled] of Object.entries(devices)) {
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isEnabled;
        checkbox.addEventListener('change', () => handleCheckboxChange(mac, checkbox.checked));
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(mac));
        listItem.appendChild(label);
        controlList.appendChild(listItem);
    }
}

async function handleCheckboxChange(mac: string, isEnabled: boolean) {
    if (!uniqueCharacteristic) return;

    const message: AccessOnOFFSingle = {
        type: 'AccessOnOFFSingle',
        sourceAddress: srcAdr,
        destinationAddress: destAdr,////mac,
        requestUUID: 'M2',
        pair: { [mac]: isEnabled }
    };
    isResCheckBox = true;
    await sendMessage(uniqueCharacteristic, message);
}

async function sendMessage(characteristic: any, message: MessageBase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    chkOn = false;

    const maxChunkSize = 160;
    for (let i = 0; i < data.length; i += maxChunkSize) {
        const chunk = data.slice(i, i + maxChunkSize);
        await characteristic.writeValue(chunk);
        await wait(10);
    }
}

function showConnectionStatus(isConnected: boolean) {
    const statusElement = document.getElementById("connection-status") as HTMLParagraphElement;
    statusElement.textContent = isConnected ? "Connected" : "Disconnected";
}

document.querySelector("form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ssid = (document.getElementById("networkList") as HTMLSelectElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (ssid && password && uniqueCharacteristic) {
        const loginMessage: LoginWWiFi = {
            type: "LoginWWiFi",
        sourceAddress: srcAdr,
        destinationAddress: destAdr,////mac,
            //sourceAddress: "00:00:00:00:00:00",
            //destinationAddress: bleDevice?.name || "unknown",
            requestUUID: "M1",
            ssid: ssid,
            pass: password
        };
        await sendMessage(uniqueCharacteristic, loginMessage);
    }
});

function updateNetworkList(networks: { [ssid: string]: boolean }) {
    const networkList = document.getElementById("networkList") as HTMLSelectElement;
    networkList.innerHTML = "";
    
   Object.entries(networks).forEach(([key, value]) => {
  	//console.log(`SSID: ${key}, Status: ${value}`);
  	        const option = document.createElement("option");
	        option.value = key;
	        option.textContent = key;
	        networkList.appendChild(option);

	});
/*    for (const [ssid] of Object.entries(networks)) {
        const option = document.createElement("option");
        option.value = ssid;
        option.textContent = ssid;
        networkList.appendChild(option);
    }*/
}
///////
async function checkConnect ()
{
	if ( needScanWiFi )
	{
	    sendScanWiFiMessage ();
	    needScanWiFi = false;
	}
	else if (chkOn)
	{
		const loginMessage: GetWiFiStatus = {
		    type: "GetWiFiStatus",
		sourceAddress: srcAdr,
		destinationAddress: destAdr,////mac,
		    requestUUID: "M4",
		};
		await sendMessage(uniqueCharacteristic, loginMessage);
        }
}

setInterval(checkConnect,5000);


