import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("delete")
	.setDescription("Delete a review.");

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const sent = await interaction.reply({
		content: "You can no longer delete reviews due to privacy reasons.",
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("why-button")
					.setLabel("Why?")
					.setEmoji("❓")
					.setStyle(ButtonStyle.Secondary)
			),
		],
		ephemeral: true,
	});

	const collector = sent.createMessageComponentCollector({
		filter: (i) => i.customId === "why-button",
		time: 15000,
	});

	collector.on("collect", async (i) => {
		const embed = new EmbedBuilder()
			.setColor("Blurple")
			.setTitle("Why can't I delete reviews?")
			.setDescription(
				"We have decided to remove the delete feature. We apologize for any inconvenience this may cause. We removed it bacause of:\n\n- Deleting reviews can hide negative experiences and make it harder for users to make informed decisions.\n- Users might question the authenticity of reviews if they can be deleted.\n\nYou can, however, edit your review to reflect your current thoughts."
			);
		await i.reply({
			embeds: [embed],
			ephemeral: true,
		});
		collector.stop();
	});
};
