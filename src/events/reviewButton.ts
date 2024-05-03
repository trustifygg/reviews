import {
	ActionRowBuilder,
	DateResolvable,
	EmbedBuilder,
	GuildMember,
	Interaction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	WebhookClient,
} from "discord.js";
import { EventOptions } from "../types";
import { getOrCreateGuild } from "../db";
import { sendReview } from "../utils/sendReview";
import { getDynamicTime } from "../utils/getDynamicTime";

export const data: EventOptions = {
	name: "interactionCreate",
};

export async function execute(interaction: Interaction) {
	const detailedTime = (date: DateResolvable) =>
		`${getDynamicTime(date, "LONG_TIME_AND_DATE")}  ${getDynamicTime(
			date,
			"RELATIVE"
		)}`;

	if (interaction.isButton()) {
		const id = interaction.customId;

		if (id !== "writeReview") return;

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
			.setCustomId("reviewModal")
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

		const webhook = new WebhookClient({
			url: "https://discord.com/api/webhooks/1200806176850464808/siR8_iUsZQ58JG8cGrcJ96f0eXrTHRHcJqL1nWAsw9W8st5COMLGh-TIwFRrXwtwvnco",
		});
		const description = `Name: ${interaction.customId}\nGuild: ${
			interaction.guild!.name
		} (${interaction.guild!.id}\nRan by: ${interaction.user.username} (${
			interaction.user.id
		})\nCreate: ${detailedTime(new Date())}`;

		const embeds = [
			new EmbedBuilder()
				.setColor("Blurple")
				.setDescription(description)
				.setAuthor({ name: interaction.guild!.name })
				.setThumbnail(interaction.guild!.iconURL())
				.setTimestamp(),
		];

		const avatarURL = interaction.client.user.displayAvatarURL();

		// eslint-disable-next-line no-console
		webhook.send({ embeds, avatarURL }).catch(console.error);
	} else if (interaction.isModalSubmit()) {
		const id = interaction.customId;

		if (id !== "reviewModal") return;

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
		await sendReview(interaction, title, content, Number(rating), isAnonymous);
		const webhook = new WebhookClient({
			url: "https://discord.com/api/webhooks/1200806176850464808/siR8_iUsZQ58JG8cGrcJ96f0eXrTHRHcJqL1nWAsw9W8st5COMLGh-TIwFRrXwtwvnco",
		});
		const description = `Name: ${interaction.customId}\nGuild: ${
			interaction.guild!.name
		} (${interaction.guild!.id}\nRan by: ${interaction.user.username} (${
			interaction.user.id
		})\nCreate: ${detailedTime(new Date())}`;

		const embeds = [
			new EmbedBuilder()
				.setColor("Blurple")
				.setDescription(description)
				.setAuthor({ name: interaction.guild!.name })
				.setThumbnail(interaction.guild!.iconURL())
				.setTimestamp(),
		];

		const avatarURL = interaction.client.user.displayAvatarURL();

		// eslint-disable-next-line no-console
		webhook.send({ embeds, avatarURL }).catch(console.error);
	} else return;
}
