import { ChatInputCommand } from '#structure/ChatInputCommand';
import { ApplyCommandOption, Command } from '#structure/Command';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { postReview } from '#manager/reviews/index';
import { generateUniqueId } from '#util/generateId';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('review')
		.setDescription('Create a review for this server.')
		.addStringOption((option) =>
			option.setName('title').setDescription('The title of your review').setRequired(true).setMaxLength(100)
		)
		.addStringOption((option) =>
			option.setName('review').setDescription('Your detailed review').setRequired(true).setMaxLength(2000)
		)
		.addNumberOption((option) =>
			option
				.setName('rating')
				.setDescription('Your rating out of 5 stars')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(5)
		)
		.addBooleanOption((option) =>
			option.setName('anonymous').setDescription('Whether to post this review anonymously').setRequired(false)
		)
		.addAttachmentOption((option) =>
			option.setName('attachment').setDescription('Optional image or file to attach to your review').setRequired(false)
		),
	{ allowDM: false }
)
export class UserCommand extends ChatInputCommand {
	public override async runTask(
		interaction: ChatInputCommandInteraction<'cached'>,
		options: Command.ChatInputOptions,
		client: Client<true>
	) {
		try {
			await interaction.deferReply({ ephemeral: false });

			const title = options.getString('title', true);
			const review = options.getString('review', true);
			const rating = options.getNumber('rating', true);
			const anonymous = options.getBoolean('anonymous') ?? false;
			const attachment = options.getAttachment('attachment');

			if (title.length > 100) {
				await interaction.editReply({
					content: 'Title must be 100 characters or less.',
				});
				return;
			}

			if (review.length > 2000) {
				await interaction.editReply({
					content: 'Review must be 2000 characters or less.',
				});
				return;
			}

			const reviewData = {
				guildId: interaction.guildId,
				reviewId: generateUniqueId(),
				title,
				review,
				rating,
				authorId: interaction.user.id,
				anonymousReview: anonymous,
				attachment: attachment?.url,
			};

			const postResult = await postReview(interaction, reviewData);

			if (!postResult.success) {
				await interaction.editReply({
					content: postResult.error || 'Failed to post review.',
				});
				return;
			}

			await interaction.editReply({
				content: 'Your review has been successfully submitted! 🎉\nThank you for your feedback!',
			});
		} catch (error) {
			console.error('Error creating review:', error);
			const errorMessage = error instanceof Error
				? `Error: ${error.message}`
				: 'There was an error submitting your review. Please try again later.';

			await interaction.editReply({ content: errorMessage }).catch(() => null);
		}
	}
}
