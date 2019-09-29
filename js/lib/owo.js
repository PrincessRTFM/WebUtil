function owo(text, cancer) {
	text = text.trim();
	cancer = cancer || owo.cancer;
	let updated = text
		.replace(/[rl]/gu, "w")
		.replace(/[RL]/gu, "W")
		.replace(/n([aeiou])/gu, "ny$1")
		.replace(/N([aeiou])/gu, "Ny$1")
		.replace(/N([AEIOU])/gu, "NY$1")
		.replace(/ove/gu, "uv")
		.replace(/OVE/gu, "UV")
		.replace(/!+/gu, () => ` ${cancer[cancer.length * Math.random() << 0]} `)
		.trim();
	if (text == text.toUpperCase()) { updated = updated.toUpperCase(); }
	return updated;
}
owo.cancer = [
	"owo",
	"uwu",
	">w<",
	">w>",
	"^w^",
];
