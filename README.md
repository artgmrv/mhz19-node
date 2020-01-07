# mhz19-node

## Example

```javascript
const MHZ19 = require("./index");

const sensor = new MHZ19({ port: "COM4", baudrate: 9600 });

sensor.get()
    .then(
        ({ co2, temperature }) => console.log(`co2: ${co2}, t: ${temperature}`)
    )
```
