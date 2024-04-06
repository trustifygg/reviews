import {
	ActionRowBuilder,
	GuildMember,
	Interaction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { EventOptions } from "../types";
import { getOrCreateGuild } from "../utils/database";
import { sendReview } from "../utils/sendReview";

export const data: EventOptions = {
	name: "interactionCreate",
};

export async function execute(interaction: Interaction) {
	if (interaction.isButton()) {
		const id = interaction.customId;

		if (!id.startsWith("writeReview")) return;

		let user: GuildMember | undefined = interaction.customId.includes("-")
			? interaction.guild?.members.cache.get(interaction.customId.split("-")[1])
			: undefined;

		if (user && interaction.user.id !== user.id) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content: "This button is not for you!.",
				ephemeral: true,
			});
			return;
		}

		if (user) {
			interaction.message.edit({
				components: [],
			});
		}

		const data = await getOrCreateGuild(interaction.guildId!);

		if (data.reviewButton === false) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content:
					"This feature is disabled! Please use </review:1205319354447826944> to create reviews instead.",
				ephemeral: true,
			});
			return;
		}

		if (!data.channel) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content:
					"There is no channel configured! Please set one through the `/config channel` command.",
				ephemeral: true,
			});
			return;
		}

		if (
			data.reviewRole &&
			!interaction
				.guild!.members.cache?.get(interaction.user.id)
				?.roles.cache.has(data.reviewRole)
		) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content: `You require the ${interaction
					.guild!.roles.cache.get(data.reviewRole)
					?.toString()} role to use this button!`,
				ephemeral: true,
			});
			return;
		}

		if (!interaction.guild!.channels.cache.get(data?.channel)) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content: `I am unable to find the configured reviews channel!`,
				ephemeral: true,
			});
			return;
		}

		const reviewModalRow1 =
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("reviewTitle")
					.setPlaceholder("Review Title")
					.setLabel("Title")
					.setStyle(TextInputStyle.Short)
					.setMaxLength(256)
					.setRequired(true)
			);

		const reviewModalRow2 =
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("reviewContent")
					.setPlaceholder("Review Content")
					.setLabel("Content")
					.setStyle(TextInputStyle.Paragraph)
					.setMaxLength(256)
					.setRequired(true)
			);

		const reviewModalRow3 =
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("reviewRating")
					.setPlaceholder("Review Rating")
					.setLabel("Rating")
					.setStyle(TextInputStyle.Short)
					.setMaxLength(1)
					.setMinLength(1)
					.setRequired(true)
			);

		const reviewModal = new ModalBuilder()
			.setTitle("Create a Review")
			.setCustomId(user ? `reviewModal-${user.id}` : "reviewModal")
			.addComponents(reviewModalRow1, reviewModalRow2, reviewModalRow3);

		if (data.anonymousReviews === true) {
			const reviewModalRow4 =
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("anonymous")
						.setPlaceholder("Anonymous")
						.setLabel("Anonymous (true/false)")
						.setStyle(TextInputStyle.Short)
						.setRequired(false)
				);
			reviewModal.addComponents(reviewModalRow4);
		}

		await interaction.showModal(reviewModal);
	} else if (interaction.isModalSubmit()) {
		const id = interaction.customId;

		if (!id.startsWith("reviewModal")) return;

		let user: GuildMember | undefined = interaction.customId.includes("-")
			? interaction.guild?.members.cache.get(interaction.customId.split("-")[1])
			: undefined;

		if (user === undefined) console.log("User is undefined");
		else console.log("User is not undefined and is", user.user.username);

		const data = await getOrCreateGuild(interaction.guildId!);

		if (!data.channel) {
			await interaction.deferUpdate();
			await interaction.followUp({
				content:
					"There is no channel configured! Please set one through the `/config channel` command.",
				ephemeral: true,
			});
			return;
		}

		const title: string = interaction.fields.getTextInputValue("reviewTitle");
		const content: string =
			interaction.fields.getTextInputValue("reviewContent");
		const rating: string = interaction.fields.getTextInputValue("reviewRating");
		const anonymous: string = data.anonymousReviews
			? interaction.fields.getTextInputValue("anonymous")
			: "false";

		if (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
			await interaction.followUp({
				content: "The rating must be a number between 1 and 5.",
				ephemeral: true,
			});
			return;
		}

		if (
			anonymous &&
			anonymous.toLowerCase() !== "true" &&
			anonymous.toLowerCase() !== "false"
		) {
			await interaction.followUp({
				content: `Anonymous must be either true or false!`,
				ephemeral: true,
			});
			return;
		}

		const isAnonymous: boolean = anonymous.toLowerCase() === "true";

		await interaction.deferUpdate();
		await sendReview(
			interaction,
			title,
			content,
			Number(rating),
			isAnonymous,
			user
		);
	} else return;
}
