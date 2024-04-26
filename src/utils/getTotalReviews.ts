import { ReviewDB } from "../models.db";

export const getTotalReviews = async (guildId: string) => {
	const reviews = await ReviewDB.find({ guildId });
	if (!reviews || reviews.length === 0) return 0;
	return reviews.length;
};
