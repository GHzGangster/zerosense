var zs = require('./index.js');


function dtime(message) {
	zs.logger.debug(new Date().getTime() + " - " + message);
}

function hex8(val) {
	var v = val & 0xff;
	var hex = v.toString(16).toUpperCase();
	return ("00" + hex).slice(-2);
}

function hex16(val) {
	var v = val & 0xffff;
	var hex = v.toString(16).toUpperCase();
	return ("0000" + hex).slice(-4);
}

function hex32(val) {
	var v = val & 0xffffffff;
	var hex = v.toString(16).toUpperCase();
	return ("00000000" + hex).slice(-8);
}

function int32(val) {
	return String.fromCharCode(val >> 16, val);
}

function int64(high, low) {
	return int32(high) + int32(low);
}

function getint16(val, offset = 0) {
	return parseInt(hex16(val.charCodeAt(offset / 2)), 16);
}

function getint32(val, offset = 0) {
	return parseInt(hex16(val.charCodeAt(offset / 2)) + hex16(val.charCodeAt(offset / 2 + 1)), 16);
}

// TODO: Add a proper hexdump function
function strhex(str) {
	var hex = [];
	for (var i = 0; i < str.length; i++) {
		hex.push(hex16(str.charCodeAt(i)));
	}
	return hex.join("");
}

function pad(size, padstr = unescape("\u0000")) {
	var str = [];
	var loops = size / (padstr.length * 2);
	for (var i = 0; i < loops; i++) {
		str.push(padstr);
	}
	return str.join("");
}

function ascii(str) {
	var res = [];
	var loops = (str.length / 2) | 0;
	for (var i = 0; i < loops; i++) {
		var c0 = str.charCodeAt(i * 2);
		var c1 = str.charCodeAt(i * 2 + 1);
		res.push(hex8(c0) + hex8(c1));
	}
	
	if ((str.length % 2) === 0) {
		res.push("0000");
	} else {
		var c = str.charCodeAt(i * 2);
		res.push(hex8(c) + "00");
	}
	
	var s = "%u" + res.join("%u");
	return unescape(s);
}

function getascii(_str, offset, _len) {
	var length = _len;
	var dropLast = length % 2 == 1;
	if (dropLast) {
		length += 1;
	}
	var str = _str.substr(offset / 2, length / 2);
	var ascii = "";
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		
		var c0 = c >> 8;
		if (c0 === 0) {
			break;
		}
		ascii += String.fromCharCode(c0);
		
		var c1 = c & 0xff;
		if (c1 === 0 || (dropLast && (i + 1 == str.length))) {
			break;
		}
		ascii += String.fromCharCode(c1);
	}
	return ascii;
}

function strcopy(str) {
	return str.substr(0, 1) + str.substr(1);
}

module.exports = {
	dtime,
	hex8,
	hex16,
	hex32,
	int32,
	int64,
	getint16,
	getint32,
	strhex,
	pad,
	ascii,
	getascii
};