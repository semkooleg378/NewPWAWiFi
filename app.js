var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
var _this = this;
var SERVICE_UUID = '0000abcd-0000-1000-8000-00805f9b34fb';
var PUBLIC_CHAR_UUID = '00001234-0000-1000-8000-00805f9b34fb';
// Manage the installation prompt
var deferredPrompt;
var addBtn = document.createElement('button');
addBtn.textContent = 'Install App';
addBtn.style.display = 'none';
document.body.appendChild(addBtn);
window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    addBtn.style.display = 'block';
    addBtn.addEventListener('click', function (e) {
        addBtn.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            }
            else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });
});
var scanButton = document.getElementById('scan-button');
var deviceList = document.getElementById('device-list');
var controlList = document.getElementById('control-list');
var wait = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var cmpUUD = function (a, b) { return a.replace(/[^a-zA-Z0-9 ]/g, "") === b.replace(/[^a-zA-Z0-9 ]/g, ""); };
var bleDevice = null;
var uniqueCharacteristic = null;
(_a = document.getElementById("scan-button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, navigator.bluetooth.requestDevice({
                        filters: [{ services: [SERVICE_UUID] }]
                    })];
            case 1:
                bleDevice = _a.sent();
                return [4 /*yield*/, connectToDevice(bleDevice)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("BLE Scan failed:", error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
})*/ ;
function displayDeviceList(device) {
    deviceList.innerHTML = '';
    var listItem = document.createElement('li');
    listItem.textContent = device.name || device.id;
    listItem.addEventListener('click', function () { return connectToDevice(device); });
    deviceList.appendChild(listItem);
}
function connectToDevice(device) {
    return __awaiter(this, void 0, void 0, function () {
        var retryCount, maxRetries, connected, _loop_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    retryCount = 0;
                    maxRetries = 6;
                    connected = false;
                    _loop_1 = function () {
                        var server, services, publicService, characteristics, publicCharacteristic, value, decoder, data_1, getMacList, error_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 8, , 10]);
                                    console.log('Connecting to device:', device);
                                    return [4 /*yield*/, device.gatt.connect()];
                                case 1:
                                    server = _b.sent();
                                    if (!server) {
                                        throw new Error('Unable to connect to GATT server');
                                    }
                                    console.log('Connected to GATT server:', server);
                                    console.log('is Connected = ', server.connected);
                                    return [4 /*yield*/, server.getPrimaryServices()];
                                case 2:
                                    services = _b.sent();
                                    console.log('Services...', services);
                                    console.log('Found services:', services.map(function (service) { return service.uuid; }));
                                    publicService = services.find(function (service) { return cmpUUD(service.uuid, SERVICE_UUID); });
                                    if (!publicService) {
                                        throw new Error('Public service not found');
                                    }
                                    console.log('Found public service:', publicService);
                                    return [4 /*yield*/, publicService.getCharacteristics()];
                                case 3:
                                    characteristics = _b.sent();
                                    console.log('Found characteristics:', characteristics.map(function (char) { return char.uuid; }));
                                    publicCharacteristic = characteristics.find(function (characteristic) { return cmpUUD(characteristic.uuid, PUBLIC_CHAR_UUID); });
                                    if (!publicCharacteristic) {
                                        throw new Error('Public characteristic not found');
                                    }
                                    console.log('Found public characteristic:', publicCharacteristic);
                                    return [4 /*yield*/, publicCharacteristic.readValue()];
                                case 4:
                                    value = _b.sent();
                                    decoder = new TextDecoder('utf-8');
                                    data_1 = decoder.decode(value);
                                    console.log('Public characteristic value:', data_1);
                                    uniqueCharacteristic = characteristics.find(function (char) { return cmpUUD(char.uuid, data_1); });
                                    if (!uniqueCharacteristic) return [3 /*break*/, 6];
                                    uniqueCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
                                    return [4 /*yield*/, uniqueCharacteristic.startNotifications()];
                                case 5:
                                    _b.sent();
                                    console.log('Found unique characteristic');
                                    return [3 /*break*/, 7];
                                case 6: throw new Error('Unique characteristic not found');
                                case 7:
                                    if (uniqueCharacteristic) {
                                        getMacList = {
                                            type: 'GetDeviceList',
                                            sourceAddress: '00:00:00:00:00:00',
                                            destinationAddress: device.name, //id,
                                            requestUUID: 'M1'
                                        };
                                        //await 
                                        sendMessage(uniqueCharacteristic, getMacList);
                                    }
                                    connected = true;
                                    return [3 /*break*/, 10];
                                case 8:
                                    error_2 = _b.sent();
                                    retryCount++;
                                    console.error("Error: ".concat(error_2, ". Retry ").concat(retryCount, "/").concat(maxRetries));
                                    return [4 /*yield*/, wait(1000)];
                                case 9:
                                    _b.sent(); // Wait 1 second before retrying
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(!connected && retryCount < maxRetries)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    if (!connected) {
                        console.error('Failed to connect to device after multiple attempts');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var destAdr = '';
var srcAdr = '';
var receivedData = '';
var isResCheckBox = false;
var chkOn = false;
function sendScanWiFiMessage() {
    if (uniqueCharacteristic) {
        var scanMessage = {
            type: "ScanWiFi",
            sourceAddress: destAdr, //"00:00:00:00:00:00",
            destinationAddress: srcAdr, //bleDevice?.name || "unknown",
            requestUUID: "M3"
        };
        sendMessage(uniqueCharacteristic, scanMessage);
    }
}
var needScanWiFi = false;
function handleNotifications(event) {
    var characteristic = event.target;
    var value = characteristic.value;
    var decoder = new TextDecoder('utf-8');
    var data = decoder.decode(value);
    receivedData += data;
    console.log('handleNotifications');
    console.log(receivedData);
    try {
        chkOn = true;
        //const message: AccessOnOff = JSON.parse(receivedData);
        var message = JSON.parse(receivedData);
        if (message.type === 'AccessOnOff') {
            displayControlList(message.list);
            receivedData = ''; // Reset buffer
            console.log('on of parsed');
            destAdr = message.sourceAddress;
            srcAdr = message.destinationAddress;
            console.log(message);
            needScanWiFi = true;
            //sendScanWiFiMessage ();
        }
        else if (message.type === "ScanWiFiResult") {
            receivedData = ''; // Reset buffer
            updateNetworkList(message.list);
        }
        else if (message.type === "ResOk") {
            receivedData = ''; // Reset buffer
            if (isResCheckBox) {
                isResCheckBox = false;
                showConnectionStatus(message.status);
            }
        }
        else
            receivedData = ''; // Reset buffer
    }
    catch (e) {
        // Not a complete JSON message yet
        console.log('on of parse error!');
    }
}
function displayControlList(devices) {
    controlList.innerHTML = '';
    var _loop_2 = function (mac, isEnabled) {
        var listItem = document.createElement('li');
        var label = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isEnabled;
        checkbox.addEventListener('change', function () { return handleCheckboxChange(mac, checkbox.checked); });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(mac));
        listItem.appendChild(label);
        controlList.appendChild(listItem);
    };
    for (var _i = 0, _a = Object.entries(devices); _i < _a.length; _i++) {
        var _b = _a[_i], mac = _b[0], isEnabled = _b[1];
        _loop_2(mac, isEnabled);
    }
}
function handleCheckboxChange(mac, isEnabled) {
    return __awaiter(this, void 0, void 0, function () {
        var message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!uniqueCharacteristic)
                        return [2 /*return*/];
                    message = {
                        type: 'AccessOnOFFSingle',
                        sourceAddress: srcAdr,
                        destinationAddress: destAdr, ////mac,
                        requestUUID: 'M2',
                        pair: (_a = {}, _a[mac] = isEnabled, _a)
                    };
                    isResCheckBox = true;
                    return [4 /*yield*/, sendMessage(uniqueCharacteristic, message)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendMessage(characteristic, message) {
    return __awaiter(this, void 0, void 0, function () {
        var encoder, data, maxChunkSize, i, chunk;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoder = new TextEncoder();
                    data = encoder.encode(JSON.stringify(message));
                    chkOn = false;
                    maxChunkSize = 160;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < data.length)) return [3 /*break*/, 5];
                    chunk = data.slice(i, i + maxChunkSize);
                    return [4 /*yield*/, characteristic.writeValue(chunk)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, wait(10)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i += maxChunkSize;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function showConnectionStatus(isConnected) {
    var statusElement = document.getElementById("connection-status");
    statusElement.textContent = isConnected ? "Connected" : "Disconnected";
}
(_b = document.querySelector("form")) === null || _b === void 0 ? void 0 : _b.addEventListener("submit", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var ssid, password, loginMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                event.preventDefault();
                ssid = document.getElementById("networkList").value;
                password = document.getElementById("password").value;
                if (!(ssid && password && uniqueCharacteristic)) return [3 /*break*/, 2];
                loginMessage = {
                    type: "LoginWWiFi",
                    sourceAddress: srcAdr,
                    destinationAddress: destAdr, ////mac,
                    //sourceAddress: "00:00:00:00:00:00",
                    //destinationAddress: bleDevice?.name || "unknown",
                    requestUUID: "M1",
                    ssid: ssid,
                    pass: password
                };
                return [4 /*yield*/, sendMessage(uniqueCharacteristic, loginMessage)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
function updateNetworkList(networks) {
    var networkList = document.getElementById("networkList");
    networkList.innerHTML = "";
    Object.entries(networks).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        //console.log(`SSID: ${key}, Status: ${value}`);
        var option = document.createElement("option");
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
function checkConnect() {
    return __awaiter(this, void 0, void 0, function () {
        var loginMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!needScanWiFi) return [3 /*break*/, 1];
                    sendScanWiFiMessage();
                    needScanWiFi = false;
                    return [3 /*break*/, 3];
                case 1:
                    if (!chkOn) return [3 /*break*/, 3];
                    loginMessage = {
                        type: "GetWiFiStatus",
                        sourceAddress: srcAdr,
                        destinationAddress: destAdr, ////mac,
                        requestUUID: "M4",
                    };
                    return [4 /*yield*/, sendMessage(uniqueCharacteristic, loginMessage)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
setInterval(checkConnect, 5000);
