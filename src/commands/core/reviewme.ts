import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	GuildMember,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { getOrCreateGuild } from "../../db";
import { sendReview } from "../../utils/sendReview";

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

	const reply = await interaction.reply({
		content: `<@${interaction.user.id}>`,
		embeds: [embed],
		components: [row],
	});

	const button = await reply.awaitMessageComponent({
		filter: (i) =>
			i.user.id === user.id && i.customId === `writeReview-${user.id}`,
		time: 60000,
	});

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

	await button.showModal(reviewModal);

	const modal = await button.awaitModalSubmit({
		filter: (i) => i.customId === `reviewModal-${user.id}`,
		time: 1000 * 60 * 5,
	});

	await modal.deferUpdate();

	const title: string = modal.fields.getTextInputValue("reviewTitle");
	const content: string = modal.fields.getTextInputValue("reviewContent");
	const rating: string = modal.fields.getTextInputValue("reviewRating");
	const anonymous: string = data.anonymousReviews
		? modal.fields.getTextInputValue("anonymous")
		: "false";

	if (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
		await modal.followUp({
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
		await modal.followUp({
			content: `Anonymous must be either true or false!`,
			ephemeral: true,
		});
		return;
	}

	const isAnonymous: boolean = anonymous.toLowerCase() === "true";

	await sendReview(
		interaction,
		title,
		content,
		Number(rating),
		isAnonymous,
		interaction.member as GuildMember
	);

	await interaction.editReply({
		components: [],
	});
}
