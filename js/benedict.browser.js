/* globals BENEDICT */
function roll() {
	const reasons = [
		"with way too much free time",
		"because someone had to",
		"with only minor shame",
		"out of a dangerously high level of boredom",
		"but it probably shouldn't have been",
		"but can you pretend it wasn't?",
		"but don't tell anyone",
	];
	const reason = document.querySelector('#reason');
	const target = document.querySelector('#name');
	const container = document.querySelector('#that-guy');
	const name = BENEDICT.name;
	let fading = true;
	if (!reason.textContent.trim() || Math.random() < 0.05) {
		const last = reason.textContent.trim();
		let next;
		do {
			next = reasons[Math.floor(Math.random() * reasons.length)].trim();
		} while (!next || next == last);
		reason.textContent = next;
	}
	const timer = setInterval(() => {
		const opacity = parseFloat(container.style.opacity || container.computedStyleMap().get('opacity').value);
		if (fading) {
			container.style.opacity = opacity - 0.05;
			if (opacity <= 0) {
				container.style.opacity = 0;
				target.textContent = name;
				fading = false;
			}
		}
		else {
			container.style.opacity = opacity + 0.05;
			if (opacity >= 1) {
				container.style.opacity = 1;
				clearInterval(timer);
			}
		}
	}, 20);
}

document.querySelector('#reroll').addEventListener('click', roll);
roll();

