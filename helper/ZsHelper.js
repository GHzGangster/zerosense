var zs = require('../index.js');

var ZsArray = require('../ZsArray.js');
var Util = require('../Util.js');


function initZsArray() {
	if (zs.zsArray === null || !zs.zsArray.verify()) {
		zs.logger.debug("Getting ZsArray...");
		
		zs.zsArray = new ZsArray(zs.memoryReader);
		
		var searchStart = 0x80000000;
		var searchEnd = 0x90000000;
		
		return zs.searcher.searchZsArray(searchStart, searchEnd - searchStart, zs.zsArray.getArray())
			.then((match) => {
				if (match === null) {
					zs.zsArray = null;
					throw new Error("Failed to init ZsArray.");
				}
				
				zs.logger.debug(`Found ZsArray at 0x${match.toString(16)}`);
				zs.zsArray.setAddress(match);
			})
			.then(() => {
				zs.logger.debug("Creating buffers...");
				
				zs.gtemp = Util.ascii("gtmp") + Util.pad(0x1000);
				zs.addrGtemp = zs.zsArray.getAddress(zs.gtemp);
				if (zs.addrGtemp === null) {
					zs.logger.error("Failed to get gtemp address.");
					return;
				}
				zs.addrGtemp += 4;
				zs.logger.debug(`Found gtemp at 0x${zs.addrGtemp.toString(16)}`);
				
				zs.logger.debug("Created buffers.");
				
				zs.logger.debug("Initialized.");
			});
	}
	
	return Promise.resolve();
}


module.exports = {
	initZsArray
};