export const getRating = (rating: number): string => {
	const roundedRating = Math.round(rating);
	let stars: string = "";
	for (let i: number = 0; i < roundedRating; i++) {
		if (roundedRating <= 2) {
			stars += "<:redstar:1214893224464883776>";
		} else if (roundedRating === 3) {
			stars += "<:yellowstar:1214893225635221534>";
		} else {
			stars += "<:greenstar:1214893223558909982>";
		}
	}

	for (let i: number = roundedRating; i < 5; i++) {
		stars += "<:emptystar:1215034091657891911>";
	}

	return stars;
};
