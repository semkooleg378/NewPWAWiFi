// app.ts
const SERVICE_UUID = '0000abcd-0000-1000-8000-00805f9b34fb';
const PUBLIC_CHAR_UUID = '00001234-0000-1000-8000-00805f9b34fb';

interface MessageBase {
    type: string;
    sourceAddress: string;
    destinationAddress: string;
    requestUUID: string;
}

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

let bleDevice: BluetoothDevice | null = null;
let uniqueCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const cmpUUD = (a: string, b: string) => a.replace(/[^a-zA-Z0-9 ]/g, "") === b.replace(/[^a-zA-Z0-9 ]/g, "");

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
                    destinationAddress: device.name,//id,
                    requestUUID: 'M1'
                };
                //await 
                //sendMessage(uniqueCharacteristic, getMacList);
                sendScanWiFiMessage();
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

/*async function connectToDevice(device: BluetoothDevice) {
    try {
        console.log('Connecting to device:', device);
        const server = await device.gatt?.connect();
        if (!server) throw new Error('Unable to connect to GATT server');

        const services = await server.getPrimaryServices();
        let publicService = services.find(service => service.uuid === SERVICE_UUID);
        if (!publicService) throw new Error('Public service not found');

        const characteristics = await publicService.getCharacteristics();
        let publicCharacteristic = characteristics.find(char => char.uuid === PUBLIC_CHAR_UUID);
        if (!publicCharacteristic) throw new Error('Public characteristic not found');

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

        //uniqueCharacteristic = publicCharacteristic;
        //uniqueCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        //await uniqueCharacteristic.startNotifications();

        sendScanWiFiMessage();
    } catch (error) {
        console.error("Error during connection:", error);
    }
}
*/
async function sendMessage(characteristic: BluetoothRemoteGATTCharacteristic, message: MessageBase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    await characteristic.writeValue(data);
}

function sendScanWiFiMessage() {
    if (uniqueCharacteristic) {
        const scanMessage: ScanWiFiMessage = {
            type: "ScanWiFi",
            sourceAddress: "00:00:00:00:00:00",
            destinationAddress: bleDevice?.name || "unknown",
            requestUUID: "M1"
        };
        sendMessage(uniqueCharacteristic, scanMessage);
    }
}

let receivedData = '';
function handleNotifications(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const decoder = new TextDecoder("utf-8");
    const value = decoder.decode(target.value);
    
    receivedData += value;
    console.log('handleNotifications');
    console.log(receivedData);

    try {
	    const response = JSON.parse(receivedData);
	    receivedData = ''; // Reset buffer
	    if (response.type === "ScanWiFiResult") {
		updateNetworkList(response.list);
	    } else if (response.type === "ResOk") {
		showConnectionStatus(response.status);
	    }
    } catch (e) {
        // Not a complete JSON message yet
	    console.log('on of parse error!');
    }
	    
}

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

function showConnectionStatus(isConnected: boolean) {
    const statusElement = document.getElementById("connection-status") as HTMLParagraphElement;
    statusElement.textContent = isConnected ? "Connected" : "Disconnected";
}

document.querySelector("form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ssid = (document.getElementById("networkList") as HTMLSelectElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (ssid && password && uniqueCharacteristic) {
        const loginMessage: LoginWiFiMessage = {
            type: "LoginWWiFi",
            sourceAddress: "00:00:00:00:00:00",
            destinationAddress: bleDevice?.name || "unknown",
            requestUUID: "M1",
            ssid: ssid,
            pass: password
        };
        await sendMessage(uniqueCharacteristic, loginMessage);
    }
});
