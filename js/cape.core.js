/* eslint-env jquery */
class Power {
	constructor(types, power, args) {
		const TAGS = {
			mover: false,
			shaker: false,
			brute: false,
			breaker: false,
			master: false,
			tinker: false,
			blaster: false,
			thinker: false,
			striker: false,
			changer: false,
			trump: false,
			stranger: false,
		};
		if (Array.isArray(types)) {
			// nop
		}
		else if (typeof types == 'object') {
			types = Object.keys(types);
		}
		else if (typeof types == 'string') {
			types = types.split(/[^a-z]+/ui);
		}
		else {
			console.error(`Invalid <types> in Power constructor (must be array, object, or string, not ${typeof types})`);
			return null;
		}
		types = types.map(s => String(s).toLowerCase());
		for (const tag in TAGS) {
			if (Object.prototype.hasOwnProperty.call(TAGS, tag)) {
				TAGS[tag] = types.includes(tag);
			}
		}
		this._types = Object.seal(TAGS);
		this._label = power || '';
		this._extra = typeof args == 'object' && args !== null ? args : {};
	}
	get powerTypes() {
		return Object.keys(this._types).filter(t => this._types[t]);
	}
	get category() {
		return this.powerTypes.map(s => s.replace(/^([a-z])/u, c => c.toUpperCase())).join('/');
	}
	get rawText() {
		return this._label || '';
	}
	get bindings() {
		return this._extra || {};
	}
	get hasBindings() {
		return !!Object.keys(this.bindings).length;
	}
	get ability() {
		let text = this.rawText;
		for (const key in this.bindings) {
			if (Object.prototype.hasOwnProperty.call(this.bindings, key)) {
				const options = this.bindings[key];
				const chosen = options[Math.floor(Math.random() * options.length)];
				text = text.replace(new RegExp(`\\{#${key}\\}`, 'ug'), `<span class="detail">${chosen}</span>`);
			}
		}
		return text;
	}
	hasType(type) {
		return !!this._types[type || ""];
	}
	isOneOf(...types) {
		while (types.length !== types.flat().length) {
			types = types.flat();
		}
		for (let i = 0; i < types.length; i++) {
			if (this.hasType(types[i])) {
				return true;
			}
		}
		return false;
	}
	toString() {
		return `${this.category} who ${this.ability}`.replace(/<span class="[a-z\s]+">/gu, '').replace(/<\/span>/gu, '');
	}
}

