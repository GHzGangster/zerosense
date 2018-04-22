## zerosense

Zerosense is an exploit toolkit for the PlayStation 3 Browser, based on work by the [PS3Xploit](https://github.com/PS3Xploit) team, and the proof-of-concepts which came before. It also takes inspiration other projects, such as [PegaSwitch](https://github.com/reswitched/pegaswitch) and [PS4 Playground](https://github.com/CTurt/PS4-playground).

This project is primarily designed to manipulate files for the [SaveMGO MGO2 Revival](https://savemgo.com/) project, to aid users on official firmware. Additional functionality may be added in the future.

Node.js is used both to bundle the application, and to act as a web server. The JavaScript target is ES3, so additional functionality is added as needed.


## Approach

We create an array a certain size, number of elements, and first element for verification. After searching, we should find the address of the array in memory. Once we have this, we can get the addresses of elements within the array.

Once we have the array, we can create our ROP chains, figure out their addresses, and then trigger the Use-After-Free exploit.

This approach allows us to conduct only one initial, cheap search, as opposed to searching for each chain in memory.


## Goals

* Have a clean and easy-to-understand codebase
* Be easily extendable
* Be able to execute quickly and reliably
* Be able to easily add support for different firmware


## Setup

Node.js and NPM should be installed beforehand. See <https://docs.npmjs.com/getting-started/installing-node>

    npm install

This project has been built using Node 7.10.1 and NPM 4.2.0. There may be some issues that arise for other versions.


## Building

    npm run build
    

## Running

    npm start

The web server will be running on port 9000, by default.