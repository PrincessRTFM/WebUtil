/* eslint-env jquery */
/* globals POWERS */
$(() => {
	const display = $('#power');
	const category = $('#category');
	const ability = $('#ability');
	const reroll = $('#reroll').button();
	const tweak = $('#tweak').button();
	const filters = $('#filters > .filterline > input').checkboxradio({icon: false});
	let CURRENT_POWER;
	const generateDifferentPower = () => {
		let nextPower = CURRENT_POWER;
		const allowed = POWERS.filter(power => power.isOneOf(
			filters
				.filter(':checked')
				.get()
				.map(cb => cb.id.replace('filter-', ''))
		));
		if (allowed.length == 0) {
			return 0;
		}
		if (allowed.length > 1) {
			do {
				nextPower = allowed[Math.floor(Math.random() * allowed.length)];
			} while (!nextPower || nextPower == CURRENT_POWER);
		}
		else {
			nextPower = allowed[0];
		}
		CURRENT_POWER = nextPower;
		return allowed.length;
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
		if (generateDifferentPower()) {
			updateDisplay();
		}
	};
	const updateFragment = () => {
		location.hash = filters.get().map(filter => (filter.checked ? '1' : '0')).join('');
	};
	if (location.hash.replace(/^#/u, '')) {
		const hash = location.hash.replace(/^#/u, '');
		const filterArray = filters.get();
		const statusArray = hash.split('');
		for (let i = 0; i < filterArray.length && i < statusArray.length; i++) {
			filterArray[i].checked = !!parseInt(statusArray[i], 10);
		}
		filters.checkboxradio('refresh');
	}
	reroll.on('click', offerNewPower);
	tweak.on('click', updateDisplay);
	filters.on('input', updateFragment);
	if (generateDifferentPower()) {
		updateDisplay();
	}
});
