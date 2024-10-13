import { IReview, reviewModel } from '#model/review';
import { ButtonInteraction, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from 'discord.js';

export class ReviewManager {
	public async deleteReview(reviewId: string) {
		await reviewModel.deleteOne({ reviewId });
		return true;
	}

	public async getReview(reviewId: string): Promise<IReview | null> {
		return reviewModel.findOne({ reviewId });
	}

	public async createReview(review: IReview) {
		await reviewModel.create(review);
	}

	public async postReview(
		interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
		review: Partial<IReview>
	) {
		const checkAnonymous = (): boolean => {
			// if (review.anonymous && data.anonymousReviews === true) return true;
			// if (data.anonymousReviews === false) return false;
			// if (data.forceAnonymousReviews === true) return true;
			return false;
		};

		// const reviewEmbed = new EmbedBuilder()
		// 	.setColor(data.customEmbed.color as ColorResolvable)
		// 	.setAuthor({
		// 		name: checkAnonymous() ? `New Anonymous Review` : `New Review by ${interaction.user.username}`,
		// 		iconURL: checkAnonymous()
		// 			? 'https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png?ex=6598568e&is=6585e18e&hm=4cf19e76c9bb3dee1802383196719c23983294c55ac93b0c1d7ea22a0284d1cd&'
		// 			: interaction.user.displayAvatarURL(),
		// 	})
		// 	.setThumbnail(
		// 		checkAnonymous()
		// 			? 'https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png?ex=6598568e&is=6585e18e&hm=4cf19e76c9bb3dee1802383196719c23983294c55ac93b0c1d7ea22a0284d1cd&'
		// 			: interaction.user.displayAvatarURL()
		// 	)
		// 	.setTitle(review.title)
		// 	.setDescription(review.review)
		// 	.addFields({
		// 		name: 'Rating:',
		// 		value: ratingStr,
		// 	})
		// 	.setFooter({
		// 		text: `Review ID: ${reviewId}`,
		// 	})
		// 	.setTimestamp();
	}
}
