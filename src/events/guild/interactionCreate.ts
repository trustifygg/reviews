import { ApplicationCommandType, InteractionType, ButtonStyle } from 'discord.js';

import type { GuildEvents } from '#types/events';

import { exitButtonHandler } from '#util/buttons';
import { verifyCommand } from '#util/verifyCommand';
import { syncCommands } from '#util/syncCommand';
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	WebhookClient,
	EmbedBuilder,
	ButtonBuilder,
	TextChannel,
	NewsChannel,
	ForumChannel,
	Message,
	ChannelType,
} from 'discord.js';
import { fetchGuildSettings, postReview } from '#manager/reviews/index';
import { getDynamicTime } from '#util/getDynamicTime';
import { generateUniqueId } from '#util/generateId';
import { IReview } from '#model/review';
import { reviewModel } from '#model/review';
import { convertButtonStyle } from '#util/convertButtonStyle';

const interactionCreateEvent: GuildEvents['InteractionCreate'] = async (interaction) => {
	if (!interaction.client.isReady() || interaction.client.uptime < 5_000) return;
	if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
		const command = interaction.client.chatInputCommands.get(interaction.commandName);
		if (!command) {
			return await syncCommands(interaction.client);
		}

		await command.autocompleteRun(interaction, interaction.options, interaction.client);
	} else if (interaction.isChatInputCommand()) {
		const command = interaction.client.chatInputCommands.get(interaction.commandName);
		if (!(await verifyCommand(interaction, command, interaction.client)) || !command) {
			return await syncCommands(interaction.client);
		}

		try {
			await command.interactionRun(interaction, interaction.options, interaction.client);
		} catch (error) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction
					.reply({
						content: 'Sorry, but something seems to have gone wrong. Please try again.',
						ephemeral: true,
					})
					.catch(() => null);
			}

			interaction.client.emit('customError', error, {
				name: interaction.commandName,
				user: interaction.user,
				guild: interaction.guild,
			});
		}
	} else if (interaction.isContextMenuCommand()) {
		const command = interaction.client.contextmenuCommands.get(interaction.commandName);
		if (!(await verifyCommand(interaction, command, interaction.client)) || !command) {
			return;
		}

		try {
			if (
				command.type === ApplicationCommandType.Message &&
				interaction.isMessageContextMenuCommand() &&
				interaction.inCachedGuild()
			) {
				await command.runTask(interaction, interaction.options, interaction.client);
			}

			if (
				command.type === ApplicationCommandType.User &&
				interaction.isUserContextMenuCommand() &&
				interaction.inCachedGuild()
			) {
				await command.runTask(interaction, interaction.options, interaction.client);
			}
		} catch (error) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction
					.reply({
						content: 'I apologize, something went wrong.',
						ephemeral: true,
					})
					.catch(() => null);
			}

			interaction.client.emit('customError', error, {
				name: interaction.commandName,
				user: interaction.user,
				guild: interaction.guild,
			});
		}
	}

	if (interaction.type === InteractionType.MessageComponent) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			await exitButtonHandler(interaction);

			if (interaction.customId.startsWith('useful-')) {
				await interaction.deferUpdate();
				const reviewId = interaction.customId.split('-')[1];
				const review = await reviewModel.findOne({
					guildId: interaction.guildId!,
					reviewId,
				});

				if (!review) {
					await interaction.followUp({
						content: 'This review does not exist.',
						ephemeral: true,
					});
					return;
				}

				if (!review.useful) {
					review.useful = {
						count: 0,
						users: [],
					};
				}

				if (review.useful.users.includes(interaction.user.id)) {
					review.useful.count--;
					const votedIndex = review.useful.users.indexOf(interaction.user.id);
					if (votedIndex !== -1) {
						review.useful.users.splice(votedIndex, 1);
					}
				} else {
					review.useful.count++;
					review.useful.users.push(interaction.user.id);
				}

				await review.save();

				const guildData = await fetchGuildSettings(interaction.guildId!);
				if (!guildData?.channel) {
					await interaction.followUp({
						content: 'Review channel not configured.',
						ephemeral: true,
					});
					return;
				}

				const channel = interaction.guild!.channels.cache.get(guildData.channel) as
					| TextChannel
					| NewsChannel
					| ForumChannel;

				if (!channel) {
					await interaction.followUp({
						content: 'Review channel not found.',
						ephemeral: true,
					});
					return;
				}

				let message: Message | undefined = undefined;

				if (channel?.type === ChannelType.GuildForum && review.threadId) {
					const thread = await channel.threads.fetch(review.threadId);
					if (thread) {
						const messages = await thread.messages.fetch();
						message = messages.first();
					}
				} else if (review.messageId) {
					try {
						message = await channel.messages.fetch(review.messageId);
					} catch {
						// Message not found
					}
				}

				const row = new ActionRowBuilder<ButtonBuilder>();

				if (guildData.reviewButton === true) {
					row.addComponents(
						new ButtonBuilder()
							.setCustomId('writeReview')
							.setLabel(guildData.customReviewButton?.label || 'Write a Review')
							.setStyle(convertButtonStyle(guildData.customReviewButton?.color || 'Primary'))
					);
				}

				if (guildData.usefulButton === true) {
					row.addComponents(
						new ButtonBuilder()
							.setCustomId(`useful-${reviewId}`)
							.setLabel(`Useful (${review.useful.count.toLocaleString()})`)
							.setEmoji('👍')
							.setStyle(ButtonStyle.Secondary)
					);
				}

				if (message) {
					await message.edit({
						components: [row],
					});
				}

				await logInteraction(interaction);
			}

			if (interaction.customId === 'writeReview') {
				const data = await fetchGuildSettings(interaction.guildId);

				if (!data) {
					await interaction.reply({
						content: 'Failed to fetch guild settings. Please try again later.',
						ephemeral: true,
					});
					return;
				}

				if (data.reviewButton === false) {
					await interaction.deferUpdate();
					await interaction.followUp({
						content: 'This feature is disabled! Please use </review:1205319354447826944> to create reviews instead.',
						ephemeral: true,
					});
					return;
				}

				if (!data.channel) {
					await interaction.deferUpdate();
					await interaction.followUp({
						content: 'There is no channel configured! Please set one through the `/config channel` command.',
						ephemeral: true,
					});
					return;
				}

				if (data.blacklistedRoles?.length > 0) {
					const hasBlacklistedRole = interaction.member.roles.cache.some((role) =>
						data.blacklistedRoles?.includes(role.id)
					);

					if (hasBlacklistedRole) {
						await interaction.deferUpdate();
						await interaction.followUp({
							content: 'You have a role that is not allowed to create reviews.',
							ephemeral: true,
						});
						return;
					}
				}

				if (data.reviewRoles?.length > 0) {
					const hasReviewRole = interaction.member.roles.cache.some((role) => data.reviewRoles?.includes(role.id));

					if (!hasReviewRole) {
						const rolesList = data.reviewRoles
							.map((roleId) => interaction.guild.roles.cache.get(roleId)?.toString())
							.filter(Boolean)
							.join(', ');

						await interaction.deferUpdate();
						await interaction.followUp({
							content: `You need one of these roles to use this button: ${rolesList}`,
							ephemeral: true,
						});
						return;
					}
				}

				const reviewModal = createReviewModal(data.anonymousReviews);
				await interaction.showModal(reviewModal);
				await logInteraction(interaction);
			}
		}
	}

	if (interaction.type === InteractionType.ModalSubmit) {
		if (interaction.customId === 'reviewModal') {
			try {
				await interaction.deferUpdate();

				const title = interaction.fields.getTextInputValue('reviewTitle');
				const content = interaction.fields.getTextInputValue('reviewContent');
				const rating = interaction.fields.getTextInputValue('reviewRating');

				let anonymous = 'no';
				try {
					anonymous = interaction.fields.getTextInputValue('anonymous') || 'no';
				} catch {
					// Field doesn't exist, use default value
				}

				if (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
					await interaction.followUp({
						content: 'The rating must be a number between 1 and 5.',
						ephemeral: true,
					});
					return;
				}

				if (title.length > 100) {
					await interaction.followUp({
						content: 'Title must be 100 characters or less.',
						ephemeral: true,
					});
					return;
				}

				if (content.length > 2000) {
					await interaction.followUp({
						content: 'Review must be 2000 characters or less.',
						ephemeral: true,
					});
					return;
				}

				const reviewData: Partial<IReview> = {
					guildId: interaction.guildId!,
					reviewId: generateUniqueId(),
					title,
					review: content,
					rating: Number(rating),
					authorId: interaction.user.id,
					anonymousReview: anonymous.toLowerCase() === 'yes',
				};

				const postResult = await postReview(interaction as any, reviewData);

				if (!postResult.success) {
					await interaction.followUp({
						content: postResult.error || 'Failed to post review.',
						ephemeral: true,
					});
					return;
				}

				await interaction.followUp({
					content: 'Your review has been successfully submitted!',
					ephemeral: true,
				});

				await logInteraction(interaction);
			} catch (error) {
				console.error('Error creating review:', error);
				const errorMessage =
					error instanceof Error
						? `Error: ${error.message}`
						: 'There was an error submitting your review. Please try again later.';

				await interaction
					.followUp({
						content: errorMessage,
						ephemeral: true,
					})
					.catch(() => null);
			}
		}
	}
};

function createReviewModal(allowAnonymous: boolean) {
	const reviewModalRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
		new TextInputBuilder()
			.setCustomId('reviewTitle')
			.setPlaceholder('Review Title')
			.setLabel('Title')
			.setStyle(TextInputStyle.Short)
			.setMaxLength(256)
			.setRequired(true)
	);

	const reviewModalRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
		new TextInputBuilder()
			.setCustomId('reviewContent')
			.setPlaceholder('Review Content')
			.setLabel('Content')
			.setStyle(TextInputStyle.Paragraph)
			.setMaxLength(256)
			.setRequired(true)
	);

	const reviewModalRow3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
		new TextInputBuilder()
			.setCustomId('reviewRating')
			.setPlaceholder('Review Rating')
			.setLabel('Rating')
			.setStyle(TextInputStyle.Short)
			.setMaxLength(1)
			.setMinLength(1)
			.setRequired(true)
	);

	const modal = new ModalBuilder()
		.setTitle('Create a Review')
		.setCustomId('reviewModal')
		.addComponents(reviewModalRow1, reviewModalRow2, reviewModalRow3);

	if (allowAnonymous) {
		const reviewModalRow4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setCustomId('anonymous')
				.setPlaceholder('Anonymous')
				.setLabel('Anonymous (yes/no)')
				.setStyle(TextInputStyle.Short)
				.setRequired(false)
		);
		modal.addComponents(reviewModalRow4);
	}

	return modal;
}

async function logInteraction(interaction: any) {
	const webhook = new WebhookClient({
		url: 'https://discord.com/api/webhooks/1200806176850464808/siR8_iUsZQ58JG8cGrcJ96f0eXrTHRHcJqL1nWAsw9W8st5COMLGh-TIwFRrXwtwvnco',
	});

	const description = `Name: ${interaction.customId}\nGuild: ${interaction.guild.name} (${
		interaction.guild.id
	}\nRan by: ${interaction.user.username} (${interaction.user.id})\nCreate: ${getDynamicTime(
		new Date(),
		'LONG_TIME_AND_DATE'
	)} ${getDynamicTime(new Date(), 'RELATIVE')}`;

	const embeds = [
		new EmbedBuilder()
			.setColor('Blurple')
			.setDescription(description)
			.setAuthor({ name: interaction.guild.name })
			.setThumbnail(interaction.guild.iconURL())
			.setTimestamp(),
	];

	const avatarURL = interaction.client.user.displayAvatarURL();
	await webhook.send({ embeds, avatarURL }).catch(console.error);
}

export default interactionCreateEvent;
