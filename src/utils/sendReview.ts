import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ChatInputCommandInteraction,
	ColorResolvable,
	EmbedBuilder,
	ForumChannel,
	GuildMember,
	ModalSubmitInteraction,
	NewsChannel,
	PermissionFlagsBits,
	TextChannel,
	ThreadAutoArchiveDuration,
} from "discord.js";
import { getOrCreateGuild } from "./database";
import { IGuild, IReview, ReviewDB } from "../models.db";
import { getRating } from "./convertToStars";
import { generateReviewId } from "./generateReviewId";
import { convertButtonStyle } from "./convertButtonStyle";

export const sendReview = async (
	interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
	title: string,
	content: string,
	rating: number,
	anonymous?: boolean,
	user?: GuildMember,
	image?: string
) => {
	const data: IGuild = await getOrCreateGuild(interaction.guildId!);
	const bot: GuildMember = interaction.guild!.members.me!;
	const channel: TextChannel | NewsChannel | ForumChannel =
		interaction.guild!.channels.cache.get(data.channel) as
			| TextChannel
			| NewsChannel
			| ForumChannel;

	if (!data.channel) {
		await interaction.reply({
			content: "No review channel set up for this server.",
			ephemeral: true,
		});
		return;
	}

	if (!bot.permissionsIn(channel).has(PermissionFlagsBits.SendMessages)) {
		await interaction.reply({
			content:
				"I do not have permission to send messages in the review channel.",
			ephemeral: true,
		});
		return;
	}

	const reviewId: string = generateReviewId();
	const ratingStr: string = getRating(rating);

	const row: ActionRowBuilder<ButtonBuilder> =
		new ActionRowBuilder<ButtonBuilder>();

	const reviewButton: boolean = data.reviewButton;

	if (reviewButton === true) {
		row.addComponents(
			new ButtonBuilder()
				.setCustomId("writeReview")
				.setLabel(data.customReviewButton.label)
				.setStyle(convertButtonStyle(data.customReviewButton.color))
		);
	}

	row.addComponents(
		new ButtonBuilder()
			.setCustomId(`useful-${reviewId}`)
			.setLabel(`Useful (0)`)
			.setEmoji("👍")
			.setStyle(ButtonStyle.Secondary)
	);

	const reviewEmbed = new EmbedBuilder()
		.setColor(data.customEmbed.color as ColorResolvable)
		.setAuthor({
			name:
				anonymous && data.anonymousReviews === true
					? `New Anonymous Review`
					: `New Review by ${interaction.user.username}`,
			iconURL:
				anonymous && data.anonymousReviews === true
					? "https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png?ex=6598568e&is=6585e18e&hm=4cf19e76c9bb3dee1802383196719c23983294c55ac93b0c1d7ea22a0284d1cd&"
					: interaction.user.displayAvatarURL(),
		})
		.setThumbnail(
			anonymous
				? "https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png?ex=6598568e&is=6585e18e&hm=4cf19e76c9bb3dee1802383196719c23983294c55ac93b0c1d7ea22a0284d1cd&"
				: interaction.user.displayAvatarURL()
		)
		.setTitle(title)
		.setDescription(content)
		.addFields({
			name: "Rating:",
			value: ratingStr,
		})
		.setFooter({
			text: `Review ID: ${reviewId}`,
		})
		.setTimestamp();

	if (user) {
		reviewEmbed.addFields({
			name: "User Reviewed",
			value: `${user.toString()}`,
		});
	}

	if (image) {
		reviewEmbed.setImage(image);
	}

	let newReview: IReview | null = null;
	let m: string = "";

	if (
		channel.type === ChannelType.GuildText ||
		channel.type === ChannelType.GuildAnnouncement
	) {
		await channel
			.send({
				embeds: [reviewEmbed],
				components: reviewButton === false ? [] : [row],
			})
			.then(async (msg) => {
				if (data.createThreads === true) {
					msg.startThread({
						name: `Review Discussion`,
						autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
					});
				}
				const newReview = new ReviewDB({
					userId: user ? user.id : null,
					guildId: interaction.guild!.id,
					reviewId: reviewId,
					messageId: msg.id,
					authorId: interaction.user.id,
					review: content,
					rating: rating,
					attachment: image,
				});

				await newReview.save();

				m = msg.id;
			});
	} else if (channel.type === ChannelType.GuildForum) {
		await channel.threads
			.create({
				name: `${title} • #${reviewId}`,
				autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
				message: {
					embeds: [reviewEmbed],
					components: reviewButton === false ? [] : [row],
				},
			})
			.then(async (thread) => {
				const threadMsgs = await thread.messages.fetch();
				const firstMessage = threadMsgs.first();
				if (firstMessage) {
					m = firstMessage.id;
				}

				const newReview = new ReviewDB({
					userId: user ? user.id : null,
					guildId: interaction.guild!.id,
					reviewId: reviewId,
					messageId: m,
					threadId: thread.id,
					authorId: interaction.user.id,
					review: content,
					rating: rating,
					attachment: image,
				});

				await newReview.save();
			});
	}

	if (data.logsChannel) {
		const logsChannel: TextChannel = interaction.guild!.channels.cache.get(
			data.logsChannel
		) as TextChannel;

		const logEmbed: EmbedBuilder = new EmbedBuilder()
			.setColor("Blurple")
			.setTitle(`Review Create Log`)
			.addFields(
				{
					name: `Review ID`,
					value: `\`\`\`${reviewId}\`\`\``,
					inline: false,
				},
				{
					name: "Review Title",
					value: `${title}`,
					inline: false,
				},
				{
					name: "Review Content",
					value: `${content}`,
					inline: false,
				},
				{
					name: "Rating",
					value: `${getRating(rating)}`,
					inline: true,
				},
				{
					name: "Author",
					value: `\`\`\`${interaction.user.username} (${interaction.user.id})\`\`\``,
					inline: true,
				},
				{
					name: "Message ID",
					value: `\`\`\`\n${m}\n\`\`\``,
					inline: true,
				}
			)
			.setImage(image ? image : null);

		await logsChannel.send({
			embeds: [logEmbed],
		});
	}
};
