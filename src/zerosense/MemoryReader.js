var Util = require('zerosense/Util');

class MemoryReader {
	
	constructor() {
		this.element = document.body.appendChild(document.createElement("div"));
	}
	
	read(address, size) {
		if (((address >> 16) & 0xffff) === 0xdead) {
			return this.fakeRead(address, size);
		}
		
		var readAddress = address;
		var readSize = size + 4;
		
		var alignment = null;
		for (var align = 0x400; align <= 0x20000; align *= 2) {
			var maxRead = align * 2;	
			var rem = readAddress % align;
			var requiredRead = readSize + rem;
			if (maxRead > requiredRead) {
				alignment = align;
				break;
			}
		}
		
		if (alignment === null) {
			logger.error("Couldn't get required alignment!");
			return null;
		}
		
		var rem = readAddress % alignment;
		if (rem !== 0) {
			readAddress -= rem;
		}
		
		readSize = alignment * 2;
		
		//logger.info("read info: " + readAddress.toString(16) + " - " + readSize.toString(16) + " - " + alignment.toString(16));
		
		//logger.info(`read | address 0x${address.toString(16)} | size 0x${size.toString(16)} | readAddress 0x${readAddress.toString(16)} | readSize 0x${readSize.toString(16)}`);
		
		this.element.style.src = "local(" + floatOverflow(readAddress, readSize) + ")";
		
		//logger.info(this.element.style.src.length);
		//logger.info(Util.strhex(this.element.style.src));
		
		var str = this.element.style.src.substr(6 + (address - readAddress) / 2, size / 2);
		
		if (str === null || str.length < size / 2) {
			logger.error("READ ERROR");
			/*logger.error((str !== null) + " - " + str.length + " - " + size / 2);
			logger.error(`${address.toString(16)} - ${size.toString(16)}`);
			logger.error(Util.strhex(str));
			
			logger.info(`read | address 0x${address.toString(16)} | size 0x${size.toString(16)} | readAddress 0x${readAddress.toString(16)} | readSize 0x${readSize.toString(16)}`);
			logger.info(Util.strhex(this.element.style.src));
			logger.info(this.element.style.src.length);*/
		}
		
		return str;
	}
	
	fakeRead(offset, size) {
		if (offset === 0xdead0500) {
			var null16 = unescape("\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000");
			var something16 = unescape("\ucafe\ubabe\u0000\u0000\u0000\u0000\u0000\u0000");
			
			var str = "";
			for (var i = 0; i < size; i += 0x10) {
				if (i === 0x20) {
					str += something16;
				} else {
					str += null16;
				}
			}
			return str;
		} else {
			var null16 = unescape("\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000");
			
			var str = "";
			for (var i = 0; i < size; i += 0x10) {
				str += null16;
			}
			return str;
		}
	}
	
}

// /////////////////////////////////////

Number.prototype.noExponents = function() {
	var data = String(this).split(/[eE]/);
	if (data.length == 1)
		return data[0];
	var z = '', sign = this < 0 ? '-' : '', str = data[0].replace('.', ''), mag = Number(data[1]) + 1;
	if (mag < 0) {
		z = sign + '0.';
		while (mag++)
			z += '0';
		return z + str.replace(/^\-/, '');
	}
	mag -= str.length;
	while (mag--)
		z += '0';
	return str + z;
}

function fromIEEE754(bytes, ebits, fbits) {
	var retNumber = 0;
	var bits = [];
	for (var i = bytes.length; i; i -= 1) {
		var b = bytes[i - 1];
		for (var j = 8; j; j -= 1) {
			bits.push(b % 2 ? 1 : 0);
			b = b >> 1;
		}
	}
	bits.reverse();
	var str = bits.join('');
	var bias = (1 << (ebits - 1)) - 1;
	var s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
	var e = parseInt(str.substring(1, 1 + ebits), 2);
	var f = parseInt(str.substring(1 + ebits), 2);
	if (e === (1 << ebits) - 1) {
		retNumber = f !== 0 ? NaN : s * Infinity;
	} else if (e > 0) {
		retNumber = s * Math.pow(2, e - bias) * (1 + f / Math.pow(2, fbits));
	} else if (f !== 0) {
		retNumber = s * Math.pow(2, -(bias - 1)) * (f / Math.pow(2, fbits));
	} else {
		retNumber = s * 0;
	}
	return retNumber.noExponents();
}

function generateIEEE754(address, size) {
	var hex = new Array((address >> 24) & 0xFF, (address >> 16) & 0xFF,
			(address >> 8) & 0xFF, (address) & 0xFF, (size >> 24) & 0xFF,
			(size >> 16) & 0xFF, (size >> 8) & 0xFF, (size) & 0xFF);
	return fromIEEE754(hex, 11, 52);
}

function floatOverflow(address, size) {
	var n = (address << 32) | ((size >> 1) - 1);
	return generateIEEE754(address, (n - address));
}

module.exports = MemoryReader;
