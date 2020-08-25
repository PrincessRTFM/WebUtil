const C_STRIKE = String.fromCodePoint(822);
const C_LINE = String.fromCodePoint();
const C_2LINE = String.fromCodePoint();

const genCharmap = chars => {
	// TODO improve the charmap geneneration
	const base = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	const max = Math.min(base.length, chars.length);
	const map = Object.create(null);
	for (let i = 0; i < max; i++) {
		map[base[i]] = chars[i];
	}
	Reflect.defineProperty(map, 'apply', {
		value(text) {
			if (!String(text).trim()) {
				return '';
			}
			const out = [];
			for (const c of String(text).split('')) {
				if (this[c]) {
					out.push(this[c]);
				}
				else if (this[c.toLowerCase()]) {
					out.push(this[c.toLowerCase()]);
				}
				else {
					out.push(c);
				}
			}
			return out.join('');
		},
	});
	return map;
};

const boldMap = genCharmap([
	120782,
	120783,
	120784,
	120785,
	120786,
	120787,
	120788,
	120789,
	120790,
	120791,
	119834,
	119835,
	119836,
	119837,
	119838,
	119839,
	119840,
	119841,
	119842,
	119843,
	119844,
	119845,
	119846,
	119847,
	119848,
	119849,
	119850,
	119851,
	119852,
	119853,
	119854,
	119855,
	119856,
	119857,
	119858,
	119859,
	119808,
	119809,
	119810,
	119811,
	119812,
	119813,
	119814,
	119815,
	119816,
	119817,
	119818,
	119819,
	119820,
	119821,
	119822,
	119823,
	119824,
	119825,
	119826,
	119827,
	119828,
	119829,
	119830,
	119831,
	119832,
	119833,
].map(c => String.fromCodePoint(c)));
const italicMap = genCharmap([
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	120354,
	120355,
	120356,
	120357,
	120358,
	120359,
	120360,
	120361,
	120362,
	120363,
	120364,
	120365,
	120366,
	120367,
	120368,
	120369,
	120370,
	120371,
	120372,
	120373,
	120374,
	120375,
	120376,
	120377,
	120378,
	120379,
	120328,
	120329,
	120330,
	120331,
	120332,
	120333,
	120334,
	120335,
	120336,
	120337,
	120338,
	120339,
	120340,
	120341,
	120342,
	120343,
	120344,
	120345,
	120346,
	120347,
	120348,
	120349,
	120350,
	120351,
	120352,
	120353,
].map(c => String.fromCodePoint(c)));
const loudMap = genCharmap([
	120782,
	120783,
	120784,
	120785,
	120786,
	120787,
	120788,
	120789,
	120790,
	120791,
	120406,
	120407,
	120408,
	120409,
	120410,
	120411,
	120412,
	120413,
	120414,
	120415,
	120416,
	120417,
	120418,
	120419,
	120420,
	120421,
	120422,
	120423,
	120424,
	120425,
	120426,
	120427,
	120428,
	120429,
	120430,
	120431,
	120380,
	120381,
	120382,
	120383,
	120384,
	120385,
	120386,
	120387,
	120388,
	120389,
	120390,
	120391,
	120392,
	120393,
	120394,
	120395,
	120396,
	120397,
	120398,
	120399,
	120400,
	120401,
	120402,
	120403,
	120404,
	120405,
].map(c => String.fromCodePoint(c)));
const gothicMap = genCharmap([
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	120198,
	120199,
	120200,
	120201,
	120202,
	120203,
	120204,
	120205,
	120206,
	120207,
	120208,
	120209,
	120210,
	120211,
	120212,
	120213,
	120214,
	120215,
	120216,
	120217,
	120218,
	120219,
	120220,
	120221,
	120222,
	120223,
	120172,
	120173,
	120174,
	120175,
	120176,
	120177,
	120178,
	120179,
	120180,
	120181,
	120182,
	120183,
	120184,
	120185,
	120186,
	120187,
	120188,
	120189,
	120190,
	120191,
	120192,
	120193,
	120194,
	120195,
	120196,
	120197,
].map(c => String.fromCodePoint(c)));
const fancyMap = genCharmap([
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	120094,
	120095,
	120096,
	120097,
	120098,
	120099,
	120100,
	120101,
	120102,
	120103,
	120104,
	120105,
	120106,
	120107,
	120108,
	120109,
	120110,
	120111,
	120112,
	120113,
	120114,
	120115,
	120116,
	120117,
	120118,
	120119,
	120068,
	120069,
	8493,
	120071,
	120072,
	120073,
	120074,
	8460,
	8465,
	120077,
	120078,
	120079,
	120080,
	120081,
	120082,
	120083,
	120084,
	8476,
	120086,
	120087,
	120088,
	120089,
	120090,
	120091,
	120092,
	8488,
].map(c => String.fromCodePoint(c)));
const cursiveMap = genCharmap([
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	120042,
	120043,
	120044,
	120045,
	120046,
	120047,
	120048,
	120049,
	120050,
	120051,
	120052,
	120053,
	120054,
	120055,
	120056,
	120057,
	120058,
	120059,
	120060,
	120061,
	120062,
	120063,
	120064,
	120065,
	120066,
	120067,
	120016,
	120017,
	120018,
	120019,
	120020,
	120021,
	120022,
	120023,
	120024,
	120025,
	120026,
	120027,
	120028,
	120029,
	120030,
	120031,
	120032,
	120033,
	120034,
	120035,
	120036,
	120037,
	120038,
	120039,
	120040,
	120041,
].map(c => String.fromCodePoint(c)));
const smallMap = genCharmap([
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	7424,
	665,
	7428,
	7429,
	7431,
	42800,
	610,
	668,
	618,
	7434,
	7435,
	671,
	7437,
	628,
	7439,
	7448,
	81,
	640,
	42801,
	7451,
	7452,
	7456,
	7457,
	120,
	655,
	7458,
].map(c => String.fromCodePoint(c)));

const insertTextAtCursor = (elem, text, highlightP) => {
	elem.focus();
	const successP = document.execCommand("insertText", false, text);
	// Firefox uses (used?) a non-standard method - the insertText command doesn't (didn't?) work for it
	if (!successP && typeof elem.setRangeText == "function") {
		const start = elem.selectionStart;
		elem.setRangeText(text);
		elem.selectionEnd = start + text.length;
		elem.selectionStart = highlightP
			? start
			: elem.selectionEnd;
		const e = document.createEvent("UIEvent");
		e.initEvent("input", true, false);
		elem.dispatchEvent(e);
	}
};
const blockEvent = evt => {
	evt.preventDefault();
	evt.stopPropagation();
	evt.returnValue = false;
	return false;
};
const e = id => document.querySelector(`textarea#${id}`);

const input = e("plain");
const bold = e('bold');
const italic = e('italic');
const loud = e('boldtalic');
const gothic = e('gothic');
const fancy = e('fancy');
const cursive = e('cursive');
const smallcaps = e('smallcaps');
const munge = () => {
	const original = input.value.trim();
	bold.value = boldMap.apply(original);
	italic.value = italicMap.apply(original);
	loud.value = loudMap.apply(original);
	gothic.value = gothicMap.apply(original);
	fancy.value = fancyMap.apply(original);
	cursive.value = cursiveMap.apply(original);
	smallcaps.value = smallMap.apply(original);
};
const copyText = evt => {
	try {
		const box = evt.originalTarget || evt.target;
		box.focus();
		box.select();
		document.execCommand("copy");
	}
	catch (err) {
		console.error("copyText() failed:", err);
	}
};
for (const box of document.querySelectorAll('textarea')) {
	box.addEventListener('input', munge);
	if (box.id != 'plain') {
		box.addEventListener('focus', copyText);
	}
}
