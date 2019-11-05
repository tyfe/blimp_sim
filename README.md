# Requirements
NodeJS (the most recent version as of 2019-10 was used)

# Setup Instructions
If you have `yarn` installed, then running `yarn install` will install all required dependencies. Otherwise, run `npm i` to install the dependencies.

# Running instructions
Run `yarn run start` or `npm run start` to start the server. The server will automatically open a page in the browser to the generated site. If you make any changes to the source code, the website will automatically be re-compiled and reloaded in your browser without any of your own intervention.

# Blimp Dimensions
Radius: 30
Motor Offset from Blimp Center: 20
Motor Input Power Ranges: [-127, 127] for both left and right motor. The motor speeds can be controlled individually.

# Using the Websocket
The websocket is currently set in the `sim.js` file. In the current implementation, it attempts to connect to a server on `'ws://localhost:5005'` (note that it's `ws` and not `wss`). If you would like to change the address/port of the connection, simply change the relevant line in `sim.js`. 
Sending the following data structures in the websocket as data (e.g. using `websocket.send()` in python) will produce the following behaviours.

Input Data Structure for Changing Motor Speed: 
```javascript
{
    leftPowerLevel: String,
    rightPowerLevel: String,
}
```
For expected operation, only send strings that can be converted to integers (i.e. `ParseInt()` works). Sending raw integers will produce unexpected results when using `0` for power levels.

Resetting the Simulator:
```javascript
{
    reset: Boolean,
}
```
Note that resetting the simulator also randomizes the wind application point and direction.

# Additional Notes
The webpage will attempt to connect to the IP address specified in `src/js/sim.js` using a websocket so that a connected server can remotely control the simulation. If necessary, the IP address can be changed in this source code. The keyboard commands will be described in that portion of the code.
