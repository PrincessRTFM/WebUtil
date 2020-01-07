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
			'food',
			'holograms',
			'musical instruments',
			'training equipment',
			'storage devices',
			'human-animal hybrids', // Furries rejoice!
			'aircraft',
			'construction',
			'espionage and spying technology',
			'magnets and magnetics',
			'inertia and gravity',
			'communication',
			'nanotechnology',
			'repair',
		],
	}),
	new Power(
		'stranger',
		'cannot be seen or heard, except by electronic devices'
	),
	new Power(
		'mover',
		'can levitate themselves and hold themselves up indefinitely, unless they lose consciousness'
	),
	new Power(
		'mover',
		'can teleport anywhere within line of sight, but only in places where they {#condition} be seen',
		{
			condition: [
				'can',
				"can't",
			],
		}
	),
	new Power(
		'stranger',
		"is unnoticable so long as they don't make eye contact"
	),
	new Power(
		'striker mover',
		'can switch the places of the last two things/people they have touched, including themselves'
	),
	new Power(
		'shaker',
		'can {#effect} their environment within {#distance} {#unit}',
		{
			effect: [
				'soften',
				'harden',
			],
			distance: [
				'five',
				'ten',
				'fifteen',
				'twenty',
			],
			unit: [
				'feet',
				'yards',
				'metres',
			],
		}
	),
	new Power(
		'shaker trump',
		'gradually drains the powers of anyone nearby, gaining their powers in the process'
	),
	new Power(
		'shaker',
		'can produce hard light within a limited area'
	),
	new Power(
		'striker',
		'makes objects indestructible, but only while in contact'
	),
	new Power(
		'blaster',
		'can spit objects at supersonic speeds'
	),
	new Power(
		'thinker',
		'can sense the presence of all nearby {#target}',
		{
			target: [
				'living creatures',
				'humans',
				'non-humans',
				'mammals (including humans)',
				'mammals (excluding humans)',
			],
		}
	),
	new Power(
		'brute breaker',
		'transfers all damage to any object being held in their hands'
	),
	new Power(
		'stranger',
		'{#verb} invisible when they close their eyes',
		{
			verb: [
				'can turn',
				'always turns',
			],
		}
	),
	new Power(
		'mover',
		'can teleport by going through doors'
	),
	new Power(
		'brute',
		'becomes more durable the closer they get to dying'
	),
	new Power(
		'master',
		'can control people while they sleep'
	),
	new Power(
		'stranger',
		'can take on the appearance of any living person they can physically see'
	),
	new Power(
		'thinker',
		'can control and vehicle perfectly, {#condition} tinker-made ones',
		{
			condition: [
				'even',
				'except',
				'but only',
			],
		}
	),
	new Power(
		'blaster',
		'can cause explosions within line of sight'
	),
	new Power(
		'brute',
		'is indestructible while holding their breath'
	),
	new Power(
		'blaster',
		'can fire a concentrated beam of radiation'
	),
	new Power(
		'blaster',
		'can fire concussive blasts'
	),
	new Power(
		'master',
		'cannot be lied to'
	),
	new Power(
		'shaker trump',
		'automatically disables all tinkertech around them'
	),
	new Power(
		'thinker',
		'gets a videogame-style 3D minimap of their area, {#verb} ally/enemy/neutral highlighting',
		{
			verb: [
				'with',
				'but without',
			],
		}
	),
	new Power(
		'striker blaster',
		'absorbs {#energy} energy on touch and can fire it back at will',
		{
			energy: [
				'thermal',
				'electrical',
			],
		}
	),
	new Power(
		'mover blaster',
		'controls air to launch themselves and enemies around'
	),
	new Power(
		'blaster',
		'can throw objects that will always home in on the target'
	),
	new Power(
		'blaster',
		'can shoot freeze rays'
	),
	new Power(
		'blaster',
		'fires burning ash'
	),
	new Power(
		'blaster',
		'can throw objects that will always return'
	),
	new Power(
		'striker changer',
		'can turn into any {#target} they have touched in the last {#time} minutes',
		{
			target: [
				'living creature (including humans)',
				'living creature (excluding humans)',
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
		}
	),
	new Power(
		'master',
		'{#verb} absolute control over the last {#target} they physically touched',
		{
			verb: [
				'can have',
				'always has',
			],
			target: [
				'living creature (including humans)',
				'living creature (excluding humans)',
				'human',
				'non-human',
				'mammal (including humans)',
				'mammal (excluding humans)',
			],
		}
	),
	new Power(
		'breaker shaker',
		'forces cartoon physics in a perfectly spherical area around them'
	),
	new Power(
		'shaker',
		'causes {#target} material around them to slowly break down, unless actively suppressing the effect',
		{
			target: [
				'non-living',
				'inorganic',
			],
		}
	),
	new Power(
		'thinker',
		'has unlimited omniscience within {#range} metres/yards',
		{
			range: [
				'five',
				'ten',
				'fifteen',
				'twenty',
				'twenty five',
			],
		}
	),
	new Power(
		'shaker',
		'makes objects move slower when approaching them, and faster when moving away'
	),
	new Power(
		'master shaker thinker',
		'temporarily makes themselves more intelligent by making those around them less so'
	),
	new Power(
		'shaker',
		'slows down anything within {#range} metres/yards that they feel threatened by, to a minimum of {#speed} {#unit}',
		{
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
		}
	),
	new Power(
		'breaker shaker',
		'creates things by drawing - the more intricate and detailed, the more {#bonus} the result',
		{
			bonus: [
				'complex',
				'powerful',
				'lasting',
			],
		}
	),
	new Power(
		'master',
		'controls people through voodoo dolls'
	),
	new Power(
		'brute mover',
		'has super speed above a certain light level and super strength below it'
	),
	new Power(
		'blaster striker',
		'can cause objects they throw to explode at will - the {#condition} the object, the bigger the explosion {#verb} be',
		{
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
		}
	),
];

