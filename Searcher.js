var zero = require('index.js');

var Util = require('./Util.js');


const BLOCK_SIZE = 0x2000;
const BLOCK_SIZE_ZSARRAY = 0x20000;

const WAIT_LOOP = 0;
const WAIT_DONE = 0;


class Searcher {

	constructor(memoryReader) {
		this.memoryReader = memoryReader;
	}
	
	searchZsArray(memoryStart, memorySize, arr) {
		var arrLength = arr.length;
		var arrValues = 1;
		var arrFirstString = arr[0];
		
		this.startTime = new Date().getTime();
		
		var p = Promise.resolve(null);
		
		for (let blockStart = 0, blockSize = 0; blockStart < memorySize; blockStart += blockSize) {
			blockSize = Math.min(BLOCK_SIZE_ZSARRAY, memorySize - blockStart);
			
			p = p.then((match) => {
				if (match !== null) {
					return match;
				}

				zero.logger.debug(`Search Array : Block 0x${blockStart.toString(16)} - 0x${blockSize.toString(16)} bytes - 0x${(memoryStart + blockStart).toString(16)}`);
				
				let block = this.memoryReader.read(memoryStart + blockStart, blockSize);
				
				for (var blockOffset = 0; blockOffset < blockSize; blockOffset += 0x4) {
					if (this.checkArray(block, blockOffset, memoryStart + blockStart + blockOffset, arrLength, arrValues, arrFirstString)) {
						return memoryStart + blockStart + blockOffset;
					}
				}
				
				return new Promise((resolve) => {
					setTimeout(() => resolve(match), WAIT_LOOP);
				});
    		});
		}
		
		p = p.then((match) => {
			return new Promise((resolve) => {
				setTimeout(() => resolve(match), WAIT_DONE);
			});
		});
		
		return p;
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
		
		var addrStrObjPtr = Util.getint32(str.substr(2, 2));
		if (addrStrObjPtr < 0x80000000 || 0x8fffffff < addrStrObjPtr) {
			return false;
		}
		
		str = this.memoryReader.read(addrStrObjPtr + 0x8, 4);
		var addrStrObj = Util.getint32(str);
		if (addrStrObj < 0x80000000 || 0x8fffffff < addrStrObj) {
			return false;
		}
		
		str = this.memoryReader.read(addrStrObj + 0x18, 4);
		var addrStr = Util.getint32(str);
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