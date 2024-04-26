import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Events,
	ForumChannel,
	Interaction,
	Message,
	NewsChannel,
	TextChannel,
} from "discord.js";
import { EventOptions } from "../types";
import { ReviewDB } from "../models.db";
import { convertButtonStyle } from "../utils/convertButtonStyle";
import { getOrCreateGuild } from "../utils/database";

export const data: EventOptions = {
	name: Events.InteractionCreate,
};

export async function execute(interaction: Interaction) {
	const guildData = await getOrCreateGuild(interaction.guildId!);

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
}
