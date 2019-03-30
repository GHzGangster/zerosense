var DEX_481 = {
	addrToc: 0x705610,
	gadget1: 0x976BC,
	gadgetMod1: 0x6161B8,
	gadgetMod2: 0x13B74,
	gadgetMod3: 0xB8EB8,
	gadgetMod4a: 0xDEBD8,
	gadgetMod5: 0x42B4CC,
	gadgetMod8: 0x2C24DC,
	gadgetMod13: 0x33E480,
	gadgetMod15: 0x3A4C28,
	
	gadgetZ1: 0x304578,
	gadgetZMod1: 0xD62B4,
	gadgetZMod2: 0x105F0,
};

var DEX_484 = {
	addrToc: 0x705648,
	gadget1: 0x976BC,
	gadgetMod1: 0x616BF4,
	gadgetMod2: 0x13B74,
	gadgetMod3: 0xB8EB8,
	gadgetMod4a: 0xDEBD8,
	gadgetMod5: 0x42B4D0,
	gadgetMod8: 0x2C24E0,
	gadgetMod13: 0x33E484,
	gadgetMod15: 0x3A4C2C,
	
	gadgetZ1: 0x30457C,
	gadgetZMod1: 0xD62B4,
	gadgetZMod2: 0x105F0,
};



function get(env) {
	var dex = env.dex;
	var fw = env.firmware;
	
	if (fw === "4.81" && dex) {
		return DEX_481;
	} else if (fw === "4.84" && dex) {
		return DEX_484;
	}
	
	throw new Error("No offsets for environment.");
}


module.exports = {
	get
};