# Requirements
NodeJS (the most recent version as of 2019-10 was used)

# Setup Instructions
If you have `yarn` installed, then running `yarn install` will install all required dependencies. Otherwise, run `npm i` to install the dependencies.

# Running instructions
Run `yarn run start` or `npm run start` to start the server. The server will automatically open a page in the browser to the generated site. If you make any changes to the source code, the website will automatically be re-compiled and reloaded in your browser without any of your own intervention.

# Additional Notes
The webpage will attempt to connect to the IP address specified in `src/js/sim.js` using a websocket so that a connected server can remotely control the simulation. If necessary, the IP address can be changed in this source code. The keyboard commands will be described in that portion of the code.
