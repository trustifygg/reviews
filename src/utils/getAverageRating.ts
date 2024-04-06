import { ReviewDB } from "../database/models";

export const getAverageRating = async (guildId: string) => {
	const reviews = await ReviewDB.find({ guildId });

	if (!reviews || reviews.length === 0) return 0;

	let totalRatings = 0;
	let validReviewsCount = 0;

	for (const review of reviews) {
		if (
			typeof review.rating === "number" &&
			review.rating >= 0 &&
			review.rating <= 5
		) {
			totalRatings += review.rating;
			validReviewsCount++;
		} else {
			console.warn(
				`Invalid rating found for review with id ${review.reviewId}`
			);
		}
	}

	if (validReviewsCount === 0) return 0;

	const averageRating = totalRatings / validReviewsCount;

	return parseFloat(averageRating.toFixed(1));
};
