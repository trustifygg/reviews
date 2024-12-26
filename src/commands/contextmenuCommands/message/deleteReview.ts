import { ApplicationCommandType } from 'discord.js';
import type { ContextMenuMessageCommand } from '#types/command';
import { reviewModel } from '#model/review';

export const command: ContextMenuMessageCommand = {
	name: 'Delete Review',
	type: ApplicationCommandType.Message,

	async runTask(interaction) {
		const messageId = interaction.targetId;

		const message = await interaction.channel?.messages.fetch(messageId);

		if (!message) {
			return interaction.reply({
				content: 'Could not find a review. Please try again.',
				ephemeral: true,
			});
		}

		const review = await reviewModel.findOne({ messageId: message.id });

		if (!review) {
			return interaction.reply({
				content: 'This is not a review. Please try again.',
				ephemeral: true,
			});
		}

		if (review.authorId !== interaction.user.id) {
			return interaction.reply({
				content: 'You can only delete your own reviews.',
				ephemeral: true,
			});
		}

		await message.delete().catch(() => null);

		return interaction.reply({
			content: `Successfuly deleted the review \`${review.reviewId}\`.`,
			ephemeral: true,
		});
	},
};
