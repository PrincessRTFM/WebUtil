const PRICES = {
	tin: 25,
	bronze: 100,
	silver: 500,
	gold: 2500,
	platinum: 10000,
};

const q = (s, b) => (b || document).querySelector(s);
const qa = (s, b) => (b || document).querySelectorAll(s);
const e = document.createElement.bind(document);

const container = q('#allagan');
const output = q('#gil');

const calculate = () => {
	let amount = 0;
	for (const line of qa("#allagan > div[id]")) {
		const price = parseInt(String(line.dataset.value), 10);
		const stacks = parseInt(String(q(".count-stack", line).value || "0"), 10);
		const extra = parseInt(String(q(".count-extra", line).value || "0"), 10);
		amount += (stacks * 99 + extra) * price;
	}
	output.textContent = amount.toLocaleString();
};

for (const [
	type,
	price,
] of Object.entries(PRICES)) {
	console.log(`Building entry line for ${type} pieces at ${price}g/ea`);
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
	lblExtra.title = `This is how many ${name} pieces you have left over, NOT stacking to 99`;
	lblExtra.textContent = "extra";
	line.id = type;
	line.dataset.value = price;
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

container.style.visibility = "visible";
output.parentElement.style.visibility = "visible";

