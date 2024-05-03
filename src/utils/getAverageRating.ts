import { ReviewDB } from "../models.db";

export const getAverageRating = async (guildId?: string, userId?: string) => {
	let reviews;
	if (guildId && userId) {
		reviews = await ReviewDB.find({ guildId, userId });
	} else if (guildId) {
		reviews = await ReviewDB.find({ guildId });
	} else if (userId) {
		reviews = await ReviewDB.find({ userId });
	} else {
		reviews = await ReviewDB.find();
	}

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
