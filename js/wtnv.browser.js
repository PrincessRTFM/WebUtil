/* globals FORTUNES_WTNV */
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
	const container = document.querySelector('#fuck-css');
	const target = document.querySelector('#content');
	const content = FORTUNES_WTNV[Math.floor(Math.random() * FORTUNES_WTNV.length)];
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
				target.textContent = content;
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

