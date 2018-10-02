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


function get(env) {
	var dex = env.dex;
	var fw = env.firmware;
	
	if (fw === "4.81" && dex) {
		return DEX_481;
	}
	
	throw new Error("No offsets for environment.");
}


module.exports = {
	get
};