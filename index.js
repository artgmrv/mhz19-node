var SerialPort = require('serialport');
const REQUEST_PACKET = [0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79];

class MHZ19 {
    _port = null;
    _buffer = [];
    _subs = [];
    _promises = [];

    static extractCO2(buffer){
        return (+('0x' + buffer[2])) * 256 + +('0x' + buffer[3]);
    }

    static extractTemperature(buffer){
        return +('0x' + buffer[4]) - 40;
    }

    constructor({
        port,
        baudrate = 9600
    }){
        this._port = port;
        this._baudrate = baudrate;
        this._initPort(this._port, this._baudrate);
    }

    _initPort(port, baudRate){
        this._port = new SerialPort(
            port,
            { baudRate }
        );
        this._port.on('data', this._onReceive);
        this._port.setEncoding('hex');
    }

    get = () => {
        this._request();
        return new Promise((resolve, reject) => {
            this._promises.push({ resolve, reject })
        });
    }

    _request = () => {
        this._port.write(
            REQUEST_PACKET,
            err => err && console.log('Error on write: ', err.message)
        );
    }

    _pushToSubscriptions = ({
        co2,
        temperature
    }) => {
        this._promises.forEach(
            ({ resolve, reject }) => resolve({ co2, temperature })
        )
        this._promises = [];
    }

    pushDataToBuffer(data){
        for (let i = 0; i < (data.length / 2); i++) {
            let str = data[i * 2];
            str += data[i * 2 + 1];
            this._buffer.push(str);
        }
    }

    _onReceive = (data) => {
        this.pushDataToBuffer(data);

        if (this._buffer.length < 9){
            return;
        }

        const co2 = MHZ19.extractCO2(this._buffer);
        const temperature = MHZ19.extractTemperature(this._buffer);
        this._pushToSubscriptions({
            co2,
            temperature
        });
        this._buffer = [];
    }
}

module.exports = MHZ19;