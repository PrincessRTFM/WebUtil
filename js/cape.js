/* eslint-env jquery */
/* globals POWERS */
$(() => {
	const display = $('#power');
	const category = $('#category');
	const ability = $('#ability');
	const reroll = $('#reroll').button();
	const tweak = $('#tweak').button();
	let CURRENT_POWER = POWERS[Math.floor(Math.random() * POWERS.length)];
	const generateDifferentPower = () => {
		let nextPower = CURRENT_POWER;
		do {
			nextPower = POWERS[Math.floor(Math.random() * POWERS.length)];
		} while (!nextPower || nextPower == CURRENT_POWER);
		CURRENT_POWER = nextPower;
	};
	const displayPower = power => {
		if (power.hasBindings) {
			const existing = ability.html();
			let updated = power.ability;
			while (updated == existing) {
				updated = power.ability;
			}
			ability.html(updated);
		}
		else {
			ability.html(power.ability);
		}
		category.html(power.category);
		display.animate({opacity: 1}, 'slow');
	};
	const updateDisplay = () => {
		if (display.css('opacity') == 0) {
			displayPower(CURRENT_POWER);
		}
		else {
			display.animate({opacity: 0}, 'slow', updateDisplay);
		}
	};
	const offerNewPower = () => {
		generateDifferentPower();
		updateDisplay();
	};
	reroll.on('click', offerNewPower);
	tweak.on('click', updateDisplay);
	updateDisplay();
});
