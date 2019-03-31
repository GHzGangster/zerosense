const DEX_481 = {
	
	toc: 0x705610,
	tocEntry4: 0x750000,
	
	////////////
	
	gadget1: 0x976BC,
	gadget6: 0x61CEBC,
	
	gadgetMod1: 0x6161B8,
	gadgetMod2: 0x13B74,
	gadgetMod3: 0xB8EB8,
	gadgetMod4a: 0xDEBD8,
	gadgetMod5: 0x42B4CC,
	gadgetMod8: 0x2C24DC,
	gadgetMod13: 0x33E480,
	gadgetMod15: 0x3A4C28,
	
	////////////
	
	tocZ1: 0x7580C0, // _sysPrxForUser_
	
	gadgetZ1: 0x304578,
	gadgetZ2: 0x61CEB8, // _sysPrxForUser__sys_malloc
	gadgetZ3: 0x61CE50, // _sysPrxForUser__sys_free
	
	gadgetZMod1: 0xD62B4,
	gadgetZMod2: 0x105F0,
	
};

const DEX_484 = {
	
	toc: 0x705648,
	tocEntry4: 0x750000,
	
	////////////
	
	gadget1: 0x976BC,
	gadget6: 0x61D8F8,
	
	gadgetMod1: 0x616BF4,
	gadgetMod2: 0x13B74,
	gadgetMod3: 0xB8EB8,
	gadgetMod4a: 0xDEBD8,
	gadgetMod5: 0x42B4D0,
	gadgetMod8: 0x2C24E0,
	gadgetMod13: 0x33E484,
	gadgetMod15: 0x3A4C2C,
	
	////////////
	
	tocZ1: 0x7586A0, // _sysPrxForUser_
	
	gadgetZ1: 0x30457C,
	gadgetZ2: 0x61D8F4, // _sysPrxForUser__sys_malloc
	gadgetZ3: 0x61D88C, // _sysPrxForUser__sys_free
	
	gadgetZMod1: 0xE4384,
	gadgetZMod2: 0x105F0,
	
};

const CEX_484 = {
	
	toc: 0x6F5558,
	tocEntry4: 0x740000,
	
	////////////
	
	gadget1: 0x97604,
	gadget6: 0x615CDC,
	
	gadgetMod1: 0x60EFD8,
	gadgetMod2: 0x13B74,
	gadgetMod3: 0xB8E00,
	gadgetMod4a: 0xD9684,
	gadgetMod5: 0x4238DC,
	gadgetMod8: 0x2BACB8,
	gadgetMod13: 0x336870,
	gadgetMod15: 0x39D038,
	
	////////////
	
	tocZ1: 0x747D10, // _sysPrxForUser_
	
	gadgetZ1: 0x2FCDBC,
	gadgetZ2: 0x615CD8, // _sysPrxForUser__sys_malloc
	gadgetZ3: 0x615C70, // _sysPrxForUser__sys_free
	
	gadgetZMod1: 0xDD518,
	gadgetZMod2: 0x105F0,
	
};


function get(env) {
	var dex = env.dex;
	var fw = env.firmware;
	
	if (fw === "4.81" && dex) {
		return DEX_481;
	} else if (fw === "4.84" && !dex) {
		return CEX_484;
	} else if (fw === "4.84" && dex) {
		return DEX_484;
	}
	
	throw new Error("No offsets for environment.");
}


module.exports = {
	get
};