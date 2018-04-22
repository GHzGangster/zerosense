var Util = require('zerosense/Util');

var sleep = require('sleep-promise');

const BLOCK_SIZE = 0x2000;
const BLOCK_SIZE_ARR = 0x2000 * 8;
const WAIT_LOOP = 50;
const WAIT_DONE = 50;

class Searcher {

	constructor(memoryReader) {
		this.memoryReader = memoryReader;
	}
	
	start(memoryStart, memorySize, searchString, onFinished) {
		this.startTime = new Date().getTime();
		this.finished = false;
		this.match = null;
		
		var searchStringLength = searchString.length;
		var searchStringFirstChar = searchString.charCodeAt(0);
		var overlap = Math.ceil(searchStringLength * 2 / 0x10) * 0x10;
		
		var p = Promise.resolve();
		
		for (let blockStart = 0, blockSize = 0, blockSizeOverlap = 0; blockStart < memorySize; blockStart += blockSize) {
			blockSize = Math.min(BLOCK_SIZE, memorySize - blockStart);
			blockSizeOverlap = Math.min(BLOCK_SIZE + overlap, memorySize - blockStart);
			
			logger.info(`Block 0x${blockStart.toString(16)} - 0x${blockSize.toString(16)} bytes - 0x${blockSizeOverlap.toString(16)} bytes`);
			
			p = p.then(() => new Promise(resolve => {
				if (this.finished) {
					return resolve();
				}
				
				let block = this.memoryReader.read(memoryStart + blockStart, blockSizeOverlap);
				let match = this.searchBlock(block, blockSizeOverlap, searchString, searchStringLength, searchStringFirstChar);
				if (match !== null) {
					//this.finished = true;
					//this.match = memoryStart + blockStart + match;
					
					var m = memoryStart + blockStart + match;
					logger.info("Match at 0x" + m.toString(16));
					
					return resolve();
				}
				
				setTimeout(resolve, WAIT_LOOP);	
    		}, () => {}));
		}
		
		p = p.then(sleep(WAIT_DONE)).then(() => {
			var t = new Date().getTime() - this.startTime;
			onFinished({ match: this.match, time: t });
		});
	}
	
	searchBlock(block, blockSize, searchString, searchStringLength, searchStringFirstChar) {
		var match = null;
		for (var blockOffset = 0; blockOffset < blockSize; blockOffset += 0x10) {
			if (block.charCodeAt(blockOffset / 2) === searchStringFirstChar) {
				var blockString = block.substr(blockOffset / 2, searchStringLength);
				if (blockString === searchString) {
					match = blockOffset;
					break;
				}
			}
		}
		return match;
	}
	
	startWithChar(memoryStart, memorySize, searchChar, searchString, onFinished) {
		this.startTime = new Date().getTime();
		this.finished = false;
		this.match = null;
		
		var searchStringLength = searchString.length;
		var overlap = Math.ceil((searchStringLength + 1) * 2 / 0x10) * 0x10;
		
		var p = Promise.resolve();
		
		for (let blockStart = 0, blockSize = 0, blockSizeOverlap = 0; blockStart < memorySize; blockStart += blockSize) {
			blockSize = Math.min(BLOCK_SIZE, memorySize - blockStart);
			blockSizeOverlap = Math.min(BLOCK_SIZE + overlap, memorySize - blockStart);
			
			logger.info(`Block 0x${blockStart.toString(16)} - 0x${blockSize.toString(16)} bytes - 0x${blockSizeOverlap.toString(16)} bytes`);
			
			p = p.then(() => new Promise(resolve => {
				if (this.finished) {
					return resolve();
				}
				
				let block = this.memoryReader.read(memoryStart + blockStart, blockSizeOverlap);
				let match = this.searchBlock(block, blockSizeOverlap, searchChar, searchString, searchStringLength);
				if (match !== null) {
					//this.finished = true;
					//this.match = memoryStart + blockStart + match;
					
					var m = memoryStart + blockStart + match;
					logger.info("Match at 0x" + m.toString(16));
					
					return resolve();
				}
				
				setTimeout(resolve, 0);	
    		}, () => {}));
		}
		
		p = p.then(sleep(WAIT_DONE)).then(() => {
			var t = new Date().getTime() - this.startTime;
			onFinished({ match: this.match, time: t });
		});
	}
	
	searchBlockWithChar(block, blockSize, searchChar, searchString, searchStringLength) {
		var match = null;
		for (var blockOffset = 0; blockOffset < blockSize; blockOffset += 0x10) {
			if (block.charCodeAt(blockOffset / 2) === searchChar) {
				var blockString = block.substr((blockOffset + 2) / 2, searchStringLength);
				if (blockString === searchString) {
					match = blockOffset;
					break;
				}
			}
		}
		return match;
	}
	
	startArray(memoryStart, memorySize, arr, onFinished) {
		var arrLength = arr.length;
		var arrValues = 1;
		var arrFirstString = arr[0];
		
		this.startTime = new Date().getTime();
		this.finished = false;
		this.match = null;
		
		var p = Promise.resolve();
		
		for (let blockStart = 0, blockSize = 0; blockStart < memorySize; blockStart += blockSize) {
			blockSize = Math.min(BLOCK_SIZE_ARR, memorySize - blockStart);
			
			p = p.then(() => new Promise(resolve => {
				if (this.finished) {
					return resolve();
				}
				
				//logger.info(`Search Array : Block 0x${blockStart.toString(16)} - 0x${blockSize.toString(16)} bytes - 0x${(memoryStart + blockStart).toString(16)}`);
				
				let block = this.memoryReader.read(memoryStart + blockStart, blockSize);
				
				for (var blockOffset = 0; blockOffset < blockSize; blockOffset += 0x4) {
					if (this.checkArray(block, blockOffset, memoryStart + blockStart + blockOffset, arrLength, arrValues, arrFirstString)) {
						this.match = memoryStart + blockStart + blockOffset;
					}
				}
				
				if (this.match !== null) {
					this.finished = true;
					return resolve();
				}
				
				setTimeout(resolve, WAIT_LOOP);	
    		}, () => {}));
		}
		
		p = p.then(sleep(WAIT_DONE)).then(() => {
			var t = new Date().getTime() - this.startTime;
			onFinished({ match: this.match, time: t });
		});
	}
	
	checkArray(block, blockOffset, addr, length, values, firstString) {
		if (block.charCodeAt(blockOffset / 2 + 1) !== length || block.charCodeAt(blockOffset / 2 + 3) !== length
			|| block.charCodeAt(blockOffset / 2 + 5) !== values || block.charCodeAt(blockOffset / 2 + 0) !== 0
			|| block.charCodeAt(blockOffset / 2 + 2) !== 0 || block.charCodeAt(blockOffset / 2 + 4) !== 0) {
			return false;
		}
		
		var str = this.memoryReader.read(addr + 0x18, 0x10);
		if (str.charCodeAt(0) !== 0xffff || str.charCodeAt(1) !== 0xfffe
			|| str.charCodeAt(2) === 0 || str.charCodeAt(3) === 0
			|| str.charCodeAt(4) !== 0xffff || str.charCodeAt(5) !== 0xfffe
			|| str.charCodeAt(6) !== 0 || str.charCodeAt(7) !== 0) {
			return false;
		}
		
		var addrStrObjPtr = Util.bin2int(str.substr(2, 2));
		if (addrStrObjPtr < 0x80000000 || 0x8fffffff < addrStrObjPtr) {
			return false;
		}
		
		str = this.memoryReader.read(addrStrObjPtr + 0x8, 4);
		var addrStrObj = Util.bin2int(str);
		if (addrStrObj < 0x80000000 || 0x8fffffff < addrStrObj) {
			return false;
		}
		
		str = this.memoryReader.read(addrStrObj + 0x18, 4);
		var addrStr = Util.bin2int(str);
		if (addrStr < 0x80000000 || 0x8fffffff < addrStr) {
			return false;
		}
		
		str = this.memoryReader.read(addrStr, firstString.length * 2);
		if (str !== firstString) {
			return false;
		}
		
		return true;
	}
	
}

module.exports = Searcher;