var DEX_481 = {
	addrToc: 0x705610,
	addrGadget1: 0x976BC,
	addrGadgetMod1: 0x6161B8,
	addrGadgetMod2: 0x13B74,
	addrGadgetMod4a: 0xDEBD8,
	addrGadgetMod8: 0x2C24DC,
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