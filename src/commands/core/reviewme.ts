import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { getOrCreateGuild } from "../../utils/database";

export const data = new SlashCommandBuilder()
	.setName("reviewme")
	.setDescription("Request a review from a user.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to request a review from.")
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = interaction.options.getUser("user");

	if (!user) {
		return interaction.reply({
			content: "User not found.",
			ephemeral: true,
		});
	}

	if (user.bot) {
		return interaction.reply({
			content: "You cannot request a review from a bot.",
			ephemeral: true,
		});
	}

	const data = await getOrCreateGuild(interaction.guildId!);

	if (!data.channel) {
		return interaction.reply({
			content: "There is no review channel set.",
			ephemeral: true,
		});
	}

	const reviewchannel = interaction.guild?.channels.cache.get(data.channel);

	if (!reviewchannel) {
		return interaction.reply({
			content: "Review channel not found.",
			ephemeral: true,
		});
	}

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`writeReview-${user.id}`)
			.setStyle(ButtonStyle.Primary)
			.setLabel("Write review")
	);

	const embed = new EmbedBuilder()
		.setColor("Blurple")
		.setTitle(`${interaction.user.username} has requested a review from you!`)
		.setDescription(
			`We value your feedback and would appreciate it if you could take a few minutes to leave a review for ${interaction.user.toString()}. Please click the button below to access the review form and provide your honest assessment. Your feedback will help us to improve our services and better serve our community.`
		)
		.setFooter({
			text: "Please be respectful and provide constructive feedback.",
		})
		.setTimestamp();

	await interaction.reply({
		embeds: [embed],
		components: [row],
	});
}
