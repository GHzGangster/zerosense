class Logger {
	
	constructor(element) {
		this.element = element;
	}
	
	getTimestamp() {
		return new Date().toLocaleTimeString();
	}
	
	info(message) {
		this.element.insertAdjacentHTML("afterbegin", "[" + this.getTimestamp() + " INFO] " + message + "<br>");
	}
	
	debug(message) {
		this.element.insertAdjacentHTML("afterbegin", "[" + this.getTimestamp() + " DEBUG] " + message + "<br>");
	}
	
 	error(message) {
		this.element.insertAdjacentHTML("afterbegin", "[" + this.getTimestamp() + " ERROR] " + message + "<br>");
	}
	
	clear() {
		this.element.innerHTML = "";
	}
	
}


module.exports = Logger;