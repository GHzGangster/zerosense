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

function getint32(val) {
	return parseInt(hex16(val.charCodeAt(0)) + hex16(val.charCodeAt(1)), 16);
}

// TODO: Add a proper hexdump function
function strhex(str) {
	var hex = [];
	for (var i = 0; i < str.length; i++) {
		hex.push(hex16(str.charCodeAt(i)));
	}
	return hex.join("");
}

function pad(size, padstr) {
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

module.exports = {
	hex8,
	hex16,
	hex32,
	int32,
	int64,
	getint32,
	strhex,
	pad,
	ascii
};