import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	DateResolvable,
	EmbedBuilder,
	Events,
	ForumChannel,
	Interaction,
	Message,
	NewsChannel,
	TextChannel,
	WebhookClient,
} from "discord.js";
import { EventOptions } from "../types";
import { ReviewDB } from "../models.db";
import { convertButtonStyle } from "../utils/convertButtonStyle";
import { getOrCreateGuild } from "../db";
import { getDynamicTime } from "../utils/getDynamicTime";

export const data: EventOptions = {
	name: Events.InteractionCreate,
};

export async function execute(interaction: Interaction) {
	const guildData = await getOrCreateGuild(interaction.guildId!);

	const detailedTime = (date: DateResolvable) =>
		`${getDynamicTime(date, "LONG_TIME_AND_DATE")}  ${getDynamicTime(
			date,
			"RELATIVE"
		)}`;

	if (!interaction.isButton()) return;
	const id = interaction.customId;

	if (!id.startsWith("useful-")) return;
	await interaction.deferUpdate();
	const reviewId = id.split("-")[1];
	const review = await ReviewDB.findOne({
		guildId: interaction.guildId!,
		reviewId,
	});

	if (!review) {
		await interaction.followUp({
			content: "This review does not exist.",
			ephemeral: true,
		});
		return;
	}

	if (review.useful.voted?.includes(interaction.user.id)) {
		await interaction.followUp({
			content: "You have already found this review useful!",
			ephemeral: true,
		});
		return;
	}

	review.useful.count++;
	review.useful.voted.push(interaction.user.id);
	await review.save();

	const channel = interaction.guild!.channels.cache.get(guildData!.channel) as
		| TextChannel
		| NewsChannel
		| ForumChannel;

	let message: Message | undefined = undefined;

	if (channel?.type === ChannelType.GuildForum) {
		const thread = await channel.threads.fetch(review.threadId);
		message = (await thread?.messages.fetch())?.first();
	} else {
		message = await channel.messages.fetch(review.messageId);
	}

	const row: ActionRowBuilder<ButtonBuilder> =
		new ActionRowBuilder<ButtonBuilder>();

	const reviewButton: boolean = guildData!.reviewButton;

	if (reviewButton === true) {
		row.addComponents(
			new ButtonBuilder()
				.setCustomId("writeReview")
				.setLabel(guildData.customReviewButton.label)
				.setStyle(convertButtonStyle(guildData.customReviewButton.color))
		);
	}

	row.addComponents(
		new ButtonBuilder()
			.setCustomId(`useful-${reviewId}`)
			.setLabel(`Useful (${review.useful.count.toLocaleString()})`)
			.setEmoji("👍")
			.setStyle(ButtonStyle.Secondary)
	);

	if (message) {
		await message.edit({
			components: [row],
		});
	}

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
}
