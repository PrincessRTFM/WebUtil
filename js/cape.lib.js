/* globals Power */
/* eslint array-element-newline: ["error", "always"] */
const POWERS = [
	new Power('tinker', 'specialises in {#tech}', {
		tech: [
			'weapons',
			'armour',
			'biological augmentation',
			'medical implants',
			'sound',
			'transportation',
			'portals',
			'materials',
		],
	}),
	new Power('striker changer', 'can turn into any {#target} they have touched in the last {#time} minutes', {
		target: [
			'living creature',
			'human',
			'non-human',
			'mammal (including humans)',
			'mammal (excluding humans)',
		],
		time: [
			'ten',
			'fifteen',
			'thirty',
		],
	}),
	new Power('master', 'has absolute control over the last {#target} they physically touched', {
		target: [
			'living creature',
			'human',
			'non-human',
			'mammal (including humans)',
			'mammal (excluding humans)',
		],
	}),
	new Power('breaker shaker', 'forces cartoon physics in a perfectly spherical area around them'),
	new Power('shaker', 'causes {#target} material around them to slowly break down, unless actively suppressing the effect', {
		target: [
			'non-living',
			'inorganic',
		],
	}),
	new Power('thinker', 'has unlimited omniscience within {#range} metres/yards', {
		range: [
			'five',
			'ten',
			'fifteen',
			'twenty',
			'twenty five',
		],
	}),
	new Power('shaker', 'makes objects move slower when approaching them, and faster when moving away'),
	new Power('master shaker thinker', 'temporarily makes themselves more intelligent by making those around them less so'),
	new Power('shaker', 'decreases the speed of anything within {#range} metres/yards that they feel threatened by, to a minimum of {#speed} {#unit}', {
		range: [
			'five',
			'ten',
			'fifteen',
			'twenty',
			'twenty five',
		],
		speed: [
			'one',
			'three',
			'five',
			'seven',
			'eight',
			'ten',
		],
		unit: [
			'mph',
			'kph',
		],
	}),
	new Power('breaker shaker', 'creates things by drawing - the more intricate and detailed, the more {#bonus} the result', {
		bonus: [
			'complex',
			'powerful',
			'lasting',
		],
	}),
	new Power('master', 'controls people through voodoo dolls'),
	new Power('brute mover', 'has super speed above a certain light level and super strength below it'),
	new Power('blaster striker', 'can cause objects they throw to explode at will - the {#condition} the object, the bigger the explosion {#verb} be', {
		condition: [
			'heavier',
			'denser',
			'bigger',
			'smaller',
			'harder',
			'softer',
		],
		verb: [
			'can',
			'will',
		],
	}),
];

