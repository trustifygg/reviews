import {
	ActionRowBuilder,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';

import { ApplyCommandOption, Command } from '#structure/Command';
import { reviewModel } from '#model/review';
import { guildModel } from '#model/guild';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('edit')
		.setDescription('Edit your review')
		.addStringOption((option) =>
			option
				.setName('review_id')
				.setDescription('The ID of the review you want to edit')
				.setRequired(true)
				.setAutocomplete(true)
		),
	{
		allowDM: false,
	}
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: AutocompleteInteraction<'cached'>) {
		const focusedValue = interaction.options.getFocused();

		// Get all reviews for this guild and user
		const reviews = await reviewModel.find({
			guildId: interaction.guildId,
			authorId: interaction.user.id,
		});

		// Filter and format reviews for autocomplete
		const choices = reviews.map(review => ({
			name: `${review.title} (${review.reviewId})`,
			value: review.reviewId
		}))
		.filter(choice => 
			choice.name.toLowerCase().includes(focusedValue.toLowerCase())
		)
		.slice(0, 25);

		await interaction.respond(choices);
	}

	public override async runTask(interaction: ChatInputCommandInteraction<'cached'>, options: Command.ChatInputOptions) {
		const reviewId = options.getString('review_id', true);

		// Find the review in database
		const review = await reviewModel.findOne({
			guildId: interaction.guildId,
			reviewId: reviewId,
		});

		if (!review) {
			return interaction.reply({
				content: 'Could not find a review with that ID.',
				ephemeral: true
			});
		}

		// Check if user owns the review
		if (review.authorId !== interaction.user.id) {
			return interaction.reply({
				content: 'You can only edit your own reviews.',
				ephemeral: true
			});
		}

		// Check if review is older than 24 hours
		const reviewAge = Date.now() - review.createdAt.getTime();
		const oneDayInMs = 24 * 60 * 60 * 1000;

		if (reviewAge > oneDayInMs) {
			return interaction.reply({
				content: 'Reviews can only be edited within 24 hours of posting.',
				ephemeral: true
			});
		}

		// Create edit modal
		const modal = new ModalBuilder()
			.setCustomId(`edit-review-${reviewId}`)
			.setTitle('Edit Review')
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('title')
						.setLabel('Title')
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setValue(review.title)
						.setMaxLength(100)
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('review')
						.setLabel('Review')
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(true)
						.setValue(review.review)
						.setMaxLength(2000)
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('rating')
						.setLabel('Rating (1-5)')
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setValue(review.rating.toString())
						.setMinLength(1)
						.setMaxLength(1)
				)
			);

		await interaction.showModal(modal);

		try {
			const modalSubmit = await interaction.awaitModalSubmit({
				filter: (i) => i.customId === `edit-review-${reviewId}` && i.user.id === interaction.user.id,
				time: 10 * 60 * 1000, // 10 minutes
			});

			const title = modalSubmit.fields.getTextInputValue('title');
			const reviewText = modalSubmit.fields.getTextInputValue('review');
			const rating = parseInt(modalSubmit.fields.getTextInputValue('rating'));

			// Validate rating
			if (isNaN(rating) || rating < 1 || rating > 5) {
				return modalSubmit.reply({
					content: 'Rating must be a number between 1 and 5',
					ephemeral: true,
				});
			}

			// Update review in database
			review.title = title;
			review.review = reviewText;
			review.rating = rating;
			review.editedAt = new Date();

			await review.save();

			// Get the review channel
			if (!review.messageId) {
				return modalSubmit.reply({
					content: 'Could not find the review message.',
					ephemeral: true,
				});
			}

			// Get the channel from guild settings instead
			const guildData = await guildModel.findOne({ guildId: interaction.guildId });
			if (!guildData?.channel) {
				return modalSubmit.reply({
					content: 'Could not find the review channel.',
					ephemeral: true,
				});
			}

			const channel = interaction.guild.channels.cache.get(guildData.channel);
			if (!channel?.isTextBased()) {
				return modalSubmit.reply({
					content: 'Could not find the review channel.',
					ephemeral: true,
				});
			}

			// Update the message
			const message = await channel.messages.fetch(review.messageId);
			if (!message) {
				return modalSubmit.reply({
					content: 'Could not find the review message.',
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder(message.embeds[0].data)
				.setTitle(title)
				.setDescription(reviewText)
				.setFields({ name: 'Rating', value: '⭐'.repeat(rating) })
				.setFooter({ text: `${message.embeds[0].footer?.text} (Edited)` });

			await message.edit({ embeds: [embed] });

			return modalSubmit.reply({
				content: 'Your review has been successfully updated!',
				ephemeral: true,
			});
		} catch (error) {
			console.error('Error editing review:', error);
			return interaction.reply({
				content: 'There was an error while editing your review. Please try again.',
				ephemeral: true
			});
		}
	}
}
