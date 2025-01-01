function stringify(param) {
	if (typeof param === 'object' && param !== null) {
		return JSON.stringify(param);
	} else if (typeof param === 'string') {
		return param;
	} else {
		throw new Error('Parameter must be an object or a string');
	}
}

module.exports = {stringify};
