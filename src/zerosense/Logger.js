class Logger {
	
	constructor(element) {
		this.element = element;
	}
	
	static init(element) {
		Logger.instance = new Logger(element); 
	}
	
	static getLogger() {
		return Logger.instance;
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

Logger.instance = null;

module.exports = Logger;