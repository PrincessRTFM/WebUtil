// eslint-disable-next-line no-unused-vars
const BENEDICT = Object.defineProperties(Object.create(null), {
	FIRST_NAMES: {
		enumerable: true,
		value: [
			"Babblebrook",
			"Bandersnatch",
			"Bandicoot",
			"Banister",
			"Barflesnarp",
			"Bassdrop",
			"Battleship",
			"Beaniebag",
			"Beetlejuice",
			"Benadryl",
			"Bendersnoot",
			"Bendybus",
			"Bendynoodle",
			"Benedryl",
			"Benevolent",
			"Benjamin",
			"Bentobox",
			"Bernadette",
			"Binglebangle",
			"Blendersquid",
			"Blenderwhoop",
			"Blueberry",
			"Blunderbuss",
			"Bodysnatch",
			"Boilerdang",
			"Bonkyhort",
			"Boobytrap",
			"Brandybuck",
			"Breadmachine",
			"Brendadirk",
			"Buckyball",
			"Buffalo",
			"Bumbershoot",
			"Bumblebee",
			"Bumbleberry",
			"Bumblesnuff",
			"Bumpersticker",
			"Bumperstump",
			"Burntisland",
			"Butterball",
			"Buttercup",
			"Butterfly",
			"Buttermilk",
			"Butternut",
			"Butterscotch",
			"Congleton",
			"Engelbert",
			"Pumpernickel",
			"Rinkydink",
			"Rumblesack",
			"Snozzlebert",
			"Wafflesmack",
		],
	},
	LAST_NAMES: {
		enumerable: true,
		value: [
			"Baggageclaim",
			"Banglesnatch",
			"Bumbersplat",
			"Bumpersplat",
			"Cabbagepatch",
			"Cabbagewank",
			"Candybatch",
			"Cattleranch",
			"Cheddarcheese",
			"Cheeseburger",
			"Chesterfield",
			"Chowderpants",
			"Clavichord",
			"Concubine",
			"Cottagecheese",
			"Cowdenbeath",
			"Crackerdong",
			"Crackerjack",
			"Craggletoe",
			"Cramplescrunch",
			"Crapplesnatch",
			"Crimplyback",
			"Crimpysnitch",
			"Crinklefries",
			"Crumblebench",
			"Crumblepatch",
			"Crumblepie",
			"Crumblycake",
			"Crumperbunts",
			"Crumpetface",
			"Crumpetman",
			"Crumpetpants",
			"Crumpetsnatch",
			"Crumplebath",
			"Crumplebench",
			"Crumpleface",
			"Crumplehorn",
			"Crumplesnitch",
			"Crunchberry",
			"Crunchysnack",
			"Crundledundle",
			"Cucumberman",
			"Cucumberpatch",
			"Cummerbund",
			"Cupboardlatch",
			"Curdledmilk",
			"Curdlesnoot",
			"Custardbath",
			"Cutiebrunch",
			"Cuttingboard",
			"Cuttlefish",
			"Humperdinck",
			"Monkeypatch",
			"Pumpkinpatch",
			"Scrabbleboard",
			"Stinkyrash",
			"Thimblesnatch",
			"Wonkypatch",
		],
	},
	name: {
		enumerable: true,
		get() {
			let first;
			let last;
			do {
				first = this.FIRST_NAMES[Math.floor(Math.random() * this.FIRST_NAMES.length)];
			} while (!first);
			do {
				last = this.LAST_NAMES[Math.floor(Math.random() * this.LAST_NAMES.length)];
			} while (!last);
			return `${first} ${last}`.trim();
		},
	},
	toString: {
		enumerable: true,
		value() {
			return this.name;
		},
	},
});
/* 52 * 58 = 3016 */
