import {
	GuildDB,
	IGuild,
	IReview,
	IUser,
	ReviewDB,
	UserDB,
} from "./models.db";

export const getGuildData = async (guildId: string): Promise<IGuild> => {
	const data = (await GuildDB.findOne({ guildId })) as IGuild;
	if (!data) new GuildDB({ guildId }).save();

	return data;
};

export const getUserData = async (userId: string): Promise<IUser> => {
	const data = (await UserDB.findOne({ userId })) as IUser;
	if (!data) new UserDB({ userId }).save();

	return data;
};

export const getReviewData = async (
	guildId: string,
	reviewId: string
): Promise<IReview | null> => {
	const data = (await ReviewDB.findOne({ guildId, reviewId })) as IReview;
	if (!data) return null;

	return data;
};
