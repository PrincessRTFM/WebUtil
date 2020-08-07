// ==UserScript==
// @name         HentaiVerse Interaction Speeder
// @namespace    Lilith
// @version      1.2.1
// @description  Speeds things along by removing the confirmation popups
// @author       PrincessRTFM
// @match        https://hentaiverse.org/?*
// @updateURL    https://gh.princessrtfm.com/js/monkey/hverse-auto-confirmer.user.js
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

const SCRIPT_NAME = `${GM_info.script.name} V${GM_info.script.version || '???'}`;
const CONS_LABEL_INIT = "Total script initialisation time";
const DEBUG = false;

(window => {
	const canJack = name => {
		if (window[name]) {
			console.info(`${name} detected - hijacking!`);
			return window[name];
		}
		console.log(`${name} not found, skipping injection`);
		return null;
	};
	const hijack = origInteract => function hijacker(...args) {
		const origConfirm = window.confirm;
		window.confirm = () => true;
		const value = Reflect.apply(origInteract, this, args);
		window.confirm = origConfirm;
		return value;
	};
	const deepjack = (object, target) => {
		if (typeof target === 'function') {
			target = target.name;
		} // Idiot-proofing against myself -_-
		const original = object[target];
		object[target] = hijack(original);
		if (DEBUG) {
			console.groupCollapsed(target || "<function reassignment>");
			console.group("Before");
			console.dir(original);
			console.log(original);
			console.groupEnd();
			console.group("After");
			console.dir(object[target]);
			console.log(object[target]);
			console.groupEnd();
			console.groupEnd();
		}
	};
	function tryjack(name, code) {
		const lbl = `${name} injection time`;
		let target;
		if (target = canJack(name)) { // eslint-disable-line no-cond-assign
			console.time(lbl);
			code(target);
			console.timeEnd(lbl);
		}
	}
	console.group(SCRIPT_NAME);
	console.time(CONS_LABEL_INIT);
	[
		"itemshop",
		"equipshop",
	].forEach(name => tryjack(name, target => deepjack(target, 'commit_transaction')));
	['init_battle'].forEach(name => tryjack(name, target => deepjack(window, target.name)));
	const name = 'HTML:shopform';
	if (document.querySelector("#shopform")) { // Couldn't make it easy, could you? Cunts.
		const lbl = `${name} injection time`;
		console.info(`${name} detected - hijacking!`);
		console.time(lbl);
		// When you don't want to pull in a whole library just so you can $('shopform>div').first()
		const div = []
			.slice
			.apply(
				document.querySelector("#shopform").children
			)
			.filter(e => e.tagName == "DIV")[0];
		div.addEventListener('click', hijack(div.onclick));
		console.timeEnd(lbl);
	}
	else {
		console.log(`${name} not found, skipping injection`);
	}
	console.timeEnd(CONS_LABEL_INIT);
	console.groupEnd();
})(unsafeWindow);

