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

function str2hex(str) {
	var hex = [];
	for (var i = 0; i < str.length; i++) {
		hex.push(hex16(str.charCodeAt(i)));
	}
	return hex.join("");
}

function int2bin(val) {
	return String.fromCharCode(val >> 16) + String.fromCharCode(val);
}

function int2bin64(high, low) {
	return int2bin(high) + int2bin(low);
}

function bin2int(val) {
	return parseInt("0x" + hex16(val.charCodeAt(0)) + hex16(val.charCodeAt(1)));
}

function padding(size, padstr) {
	var str = [];
	var loops = size / (padstr.length * 2);
	for (var i = 0; i < loops; i++) {
		str.push(padstr);
	}
	return str.join("");
}

module.exports = {
	hex8,
	hex16,
	hex32,
	str2hex,
	int2bin,
	int2bin64,
	bin2int,
	padding
};