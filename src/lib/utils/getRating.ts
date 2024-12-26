import { Constants } from './constants';

export const getRating = (rating: number): string => {
	const roundedRating = Math.round(rating);
	let stars: string = '';
	for (let i: number = 0; i < roundedRating; i++) {
		if (roundedRating <= 2) {
			stars += Constants.emojis.bad;
		} else if (roundedRating === 3) {
			stars += Constants.emojis.neutral;
		} else {
			stars += Constants.emojis.good;
		}
	}

	for (let i: number = roundedRating; i < 5; i++) {
		stars += Constants.emojis.empty;
	}

	return stars;
};
