const PRICES = {
	tin: 25,
	bronze: 100,
	silver: 500,
	gold: 2500,
	platinum: 10000,
};

Object.defineProperty(window, 'DEBUG_MODE', {
	writable: true,
	value: location.hash.replace(/^#+/u, '') == "debug",
});

const q = (s, b) => (b || document).querySelector(s);
const qa = (s, b) => (b || document).querySelectorAll(s);
const e = document.createElement.bind(document);

const container = q('#allagan');
const output = q('#gil');
const bank = q('#banking');
const config = Object.create(null);
const debug = Object.create(null);

// Initialise the debug logger - basically console.* except it only runs if window.DEBUG is truthy
for (const k of Object.keys(console)) {
	debug[k] = (...varargs) => {
		if (window.DEBUG_MODE) {
			console[k](...varargs);
		}
	};
}
Object.freeze(debug);
debug.log("Debug mode enabled"); // won't actually show unless it's true!

// Initialise the configuration for this page (it's very simple)
config.banking = false;

// Load any saved configuration that exists
Object.seal(config);
try {
	const storedValue = localStorage.getItem("allagan");
	if (typeof storedValue == 'string') {
		const stored = JSON.parse(storedValue);
		const exists = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
		for (const [
			key,
			value,
		] of Object.entries(stored)) {
			if (exists(config, key)) {
				config[key] = value;
			}
		}
	}
	debug.log("Loaded configuration from localstorage");
}
catch (err) {
	console.error("Can't load configuration from localstorage:", err);
}
finally {
	debug.dir(config);
}

const calculate = () => {
	config.banking = bank.checked;
	try {
		localStorage.setItem("allagan", JSON.stringify(config));
	}
	catch (err) {
		console.error("Can't save configuration to localstorage:", err);
	}
	let total = 0;
	debug.groupCollapsed("Calculation details");
	for (const line of qa("#allagan > div.allagan")) {
		const type = line.id;
		const price = parseInt(String(line.dataset.value), 10);
		const stacks = parseInt(String(q(".count-stack", line).value || "0"), 10);
		const extra = parseInt(String(q(".count-extra", line).value || "0"), 10);
		const quantStacks = Math.max(0, stacks * (99 - config.banking));
		const quantExtra = Math.max(0, extra - config.banking);
		const money = (quantStacks + quantExtra) * price;
		debug.log([
			`At ${price}/ea, with${config.banking ? '' : 'out'} banking, having`,
			`${stacks} stack(s) for ${quantStacks} and ${extra} (${quantExtra}) extra,`,
			`${type} pieces can make (${quantStacks} + ${quantExtra}) * ${price} = ${money} gil.`,
		].join(" "));
		total += money;
	}
	debug.groupEnd();
	output.textContent = total.toLocaleString();
};

for (const [
	type,
	price,
] of Object.entries(PRICES)) {
	debug.log(`Building entry line for ${type} pieces at ${price}g/ea`);
	const name = type.slice(0, 1).toUpperCase() + type.slice(1);
	const line = e('div');
	const stacks = e('input');
	const items = e('input');
	const lblStack = e('abbr');
	const lblExtra = e('abbr');
	const label = e('abbr');
	const content = e('span');
	stacks.type = 'number';
	stacks.min = 0;
	stacks.value = 0;
	stacks.addEventListener('input', calculate);
	stacks.addEventListener('focus', () => stacks.select());
	stacks.className = "count-stack"; // eslint-disable-line unicorn/no-keyword-prefix
	items.type = 'number';
	items.min = 0;
	items.max = 98;
	items.value = 0;
	items.addEventListener('input', calculate);
	items.addEventListener('focus', () => items.select());
	items.className = "count-extra"; // eslint-disable-line unicorn/no-keyword-prefix
	lblStack.title = "Allagan pieces all stack to 99";
	lblStack.textContent = "stacks";
	lblExtra.title = `This is how many ${name.toLowerCase()} pieces you have left over, NOT stacking to 99`;
	lblExtra.textContent = "extra";
	line.id = type;
	line.dataset.value = price;
	line.className = "allagan"; // eslint-disable-line unicorn/no-keyword-prefix
	label.textContent = name;
	label.title = `${name} pieces sell for ${price.toLocaleString()} gil each`;
	content.append(
		stacks,
		" ",
		lblStack,
		" and ",
		items,
		" ",
		lblExtra
	);
	label.className = "label"; // eslint-disable-line unicorn/no-keyword-prefix
	content.className = "content"; // eslint-disable-line unicorn/no-keyword-prefix
	line.append(label, content);
	container.append(line);
}
container.append(document.querySelector("#banking-container"));
bank.addEventListener('input', calculate);
bank.checked = config.banking || false;

container.style.visibility = "visible";
output.parentElement.style.visibility = "visible";

