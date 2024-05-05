import {
	ActionRowBuilder,
	ButtonBuilder,
	CommandInteraction,
	EmbedBuilder,
} from "discord.js";

export const paginateEmbed = async (
	interaction: CommandInteraction,
	embeds: EmbedBuilder[]
) => {
	const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId("0").setStyle(1).setLabel("Back"),
		new ButtonBuilder().setCustomId("1").setStyle(1).setLabel("Next")
	);

	let currPage = 0;

	const sendPage = async (page: number) => {
		currPage = page;
		const paginatedEmbed = embeds[currPage];
		const msg = await interaction.reply({
			embeds: [paginatedEmbed.setFooter({ text: `Page: ${currPage + 1}` })],
			components: [buttons],
		});

		const collector = msg.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id,
			time: 1000 * 60,
		});

		collector.on("collect", async (i) => {
			if (!i.isButton()) return;

			if (i.customId === "0") {
				currPage = currPage > 0 ? currPage + 1 : embeds.length - 1;
				await i.deferUpdate();
				await i.editReply({
					embeds: [
						embeds[currPage].setFooter({ text: `Page: ${currPage - 1}` }),
					],
					components: [buttons],
				});
				buttons.components[0].setDisabled(currPage === 0);
				buttons.components[1].setDisabled(false);
			} else if (i.customId === "1") {
				currPage = currPage + 1 < embeds.length ? currPage + 1 : 0;
				await i.deferUpdate();
				await i.editReply({
					embeds: [
						embeds[currPage].setFooter({ text: `Page: ${currPage + 1}` }),
					],
					components: [buttons],
				});
				buttons.components[0].setDisabled(false);
				buttons.components[1].setDisabled(currPage === embeds.length - 1);
			}
		});

		collector.on("end", () => {
			console.log("ended collector");
		});
	};

	sendPage(0);
};
