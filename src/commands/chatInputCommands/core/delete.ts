import { reviewModel } from '#model/review';
import { ApplyCommandOption, Command } from '#structure/Command';
import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes a review')
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

		const reviews = await reviewModel.find({
			guildId: interaction.guildId,
			authorId: interaction.user.id,
		});

		const choices = reviews
			.map((review) => ({
				name: `${review.title} (${review.reviewId})`,
				value: review.reviewId,
			}))
			.filter((choice) => choice.name.toLowerCase().includes(focusedValue.toLowerCase()))
			.slice(0, 25);

		await interaction.respond(choices);
	}

	public override async runTask(interaction: ChatInputCommandInteraction<'cached'>, options: Command.ChatInputOptions) {
		const reviewId = options.getString('review_id', true);

		const review = await reviewModel.findOne({
			guildId: interaction.guildId,
			reviewId: reviewId,
		});

		if (!review) {
			return interaction.reply({
				content: 'Could not find a review with that ID.',
				ephemeral: true,
			});
		}

		if (review.authorId !== interaction.user.id) {
			return interaction.reply({
				content: 'You can only delete your own reviews.',
				ephemeral: true,
			});
		}

		await reviewModel.deleteOne({
			guildId: interaction.guildId,
			reviewId: reviewId,
		});

		return interaction.reply({
			content: 'Successfully deleted your review.',
			ephemeral: true,
		});
	}
}
