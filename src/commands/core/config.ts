import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	TextChannel,
	Role,
	bold,
	ActionRowBuilder,
	ButtonBuilder,
	ColorResolvable,
	ComponentType,
	EmbedBuilder,
	strikethrough,
	ModalBuilder,
	TextInputBuilder,
	GuildMember,
} from "discord.js";
import { createGuild, getOrCreateGuild } from "../../db";
import { validateHTMLColorHex } from "validate-color";
import { convertButtonStyle } from "../../utils/convertButtonStyle";
import { botClient } from "../..";
import { checkIfUserVoted } from "../../utils/hasVoted";

export const data = new SlashCommandBuilder()
	.setName("config")
	.setDescription("Configure the Reviews in your server.")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false)
	.addSubcommand((sub) =>
		sub
			.setName("channel")
			.setDescription("Set the channel where reviews will be sent.")
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription("The channel where reviews will be sent.")
					.setRequired(true)
					.addChannelTypes(
						ChannelType.GuildText,
						ChannelType.GuildAnnouncement,
						ChannelType.GuildForum
					)
			)
			.addBooleanOption((option) =>
				option
					.setName("panel")
					.setDescription(
						"Would you like to send a panel every time a review is created?"
					)
					.setRequired(false)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("logs")
			.setDescription("Set the logs channel.")
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription("The channel where logs will be sent.")
					.setRequired(true)
					.addChannelTypes(ChannelType.GuildText)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("review-role")
			.setDescription(
				"Set the role that will be required when submitting a review."
			)
			.addRoleOption((option) =>
				option
					.setName("role")
					.setDescription("The role that will be required.")
					.setRequired(true)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("anonymous-reviews")
			.setDescription("Toggle anonymous reviews.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable anonymous reviews or 'no' to disable them."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable Anonymous Reviews", value: "yes" },
						{ name: "Disable Anonymous Reviews", value: "no" },
						{ name: "Force Anonymous Reviews", value: "forceAnonymous" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("threads")
			.setDescription("Set whether to enable ot disable threads.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable threads or 'no' to disable them."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("review-button")
			.setDescription("Set whether to enable or disable review button.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable review button or 'no' to disable it."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("reset")
			.setDescription("Reset the configuration of the bot.")
			.addStringOption((option) =>
				option
					.setName("confirm")
					.setDescription("Type 'confirm' to reset the configuration.")
					.setRequired(true)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("customize")
			.setDescription("Customize the bot for your server.")
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const { options } = interaction;
	const data = await getOrCreateGuild(interaction.guildId!);

	const bot = interaction.guild?.members.cache.get(
		botClient.user!.id
	) as GuildMember;

	const supportRow: ActionRowBuilder<ButtonBuilder> =
		new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder()
				.setLabel("Support server")
				.setStyle(5)
				.setURL("https://discord.gg/J9bTk96RRX")
		);

	const checkBotPermissions = async (
		channel: TextChannel
	): Promise<boolean> => {
		if (
			!bot
				.permissionsIn(channel.id)
				.has([
					PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.AttachFiles,
				])
		) {
			await interaction.reply({
				content: `I am missing one or both of the following permissions in ${channel.toString()}:\n\n> - **Send Messages**\n> - **Attach Files**`,
				components: [supportRow],
				ephemeral: true,
			});
			return false;
		}
		return true;
	};

	switch (options.getSubcommand()) {
		case "channel":
			{
				const channel = options.getChannel("channel", true) as TextChannel;
				const panel = options.getBoolean("panel", false);

				if (!channel && !(await checkBotPermissions(channel))) return;

				data.channel = channel.id;
				await data.save();

				if (panel === true) {
					const editPanelContentModal = new ModalBuilder()
						.setTitle("Edit Panel Content")
						.setCustomId("editPanelContentModal")
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setLabel("Title")
									.setCustomId("panelTitle")
									.setPlaceholder("The title of the panel")
									.setStyle(1)
									.setValue("🌟 Leave us a Review! 🌟")
							),
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setLabel("Description")
									.setCustomId("panelDescription")
									.setPlaceholder("The description of the panel")
									.setStyle(1)
									.setValue(
										` Help us improve by sharing your valuable thoughts and experiences with Reviews. Click the button below to create your review and let us know what you love or any areas where we can enhance reviews. `
									)
							)
						);

					await interaction.showModal(editPanelContentModal);

					const modal = await interaction.awaitModalSubmit({
						filter: (i) => i.customId === "editPanelContentModal",
						time: 1000 * 60 * 5,
					});

					await modal.deferUpdate();

					const panelTitle = modal.fields.getTextInputValue("panelTitle");
					const panelDescription =
						modal.fields.getTextInputValue("panelDescription");

					const panelEmbed = new EmbedBuilder()
						.setColor("Blurple")
						.setTitle(panelTitle)
						.setDescription(panelDescription)
						.setFooter({
							text: "Reviews @ 2024",
						});

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("writeReview")
							.setLabel(data.customReviewButton.label)
							.setStyle(convertButtonStyle(data.customReviewButton.color))
					);

					await channel.send({
						embeds: [panelEmbed],
						components: [row],
					});
				}

				await interaction.reply({
					content: `Reviews will now be sent to ${channel.toString()}`,
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "logs":
			{
				const channel: TextChannel = options.getChannel("channel", true);
				data.logsChannel = channel.id;
				await data.save();
				await interaction.reply({
					content: `Logs will now be sent to ${channel.toString()}`,
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "review-role":
			{
				const role = options.getRole("role", true) as Role;
				data.reviewRole = role.id;
				await data.save();
				await interaction.reply({
					content: `Reviews will now require the role ${role.toString()}`,
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "review-button":
			{
				const toggle: string = options.getString("toggle", true);
				data.reviewButton = toggle === "yes" ? true : false;
				await data.save();
				await interaction.reply({
					content: `The review button has been ${bold(
						toggle === "yes" ? "Enabled" : "Disabled"
					)}.`,
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "anonymous-reviews":
			{
				const toggle: string = options.getString("toggle", true);

				if (toggle === "forceAnonymous") {
					data.forceAnonymousReviews = !data.forceAnonymousReviews;
					await data.save();
					await interaction.reply({
						content:
							data.forceAnonymousReviews === true
								? `Reviews will now be forced to be anonymous. To remove it run the command again and select the same option.`
								: "Reviews are no longer forced to be anonymous.",
						components: [supportRow],
						ephemeral: true,
					});
				} else if (toggle === "yes" || toggle === "no") {
					data.anonymousReviews = toggle === "yes" ? true : false;
					await data.save();
					await interaction.reply({
						content: `Anonymous reviews has been ${bold(
							toggle === "yes" ? "Enabled" : "Disabled"
						)}.`,
						components: [supportRow],
						ephemeral: true,
					});
				}
			}
			break;

		case "threads":
			{
				const toggle: string = options.getString("toggle", true);
				data.createThreads = toggle === "yes" ? true : false;
				await data.save();
				await interaction.reply({
					content: `Threads have been ${bold(
						toggle === "yes" ? "Enabled" : "Disabled"
					)}.`,
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "reset":
			{
				const confirm: string = options.getString("confirm", true);
				if (confirm !== "confirm") {
					await interaction.reply({
						content: "You need to type 'confirm' to reset the configuration.",
						components: [supportRow],
						ephemeral: true,
					});
					return;
				}

				await data
					.deleteOne()
					.then(async () => await createGuild(interaction.guildId as string));

				await interaction.reply({
					content: "The configuration has been reset.",
					components: [supportRow],
					ephemeral: true,
				});
			}
			break;

		case "customize":
			{
				if ((await checkIfUserVoted(interaction.user.id)) === false) {
					return await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor("Red")
								.setTitle("🤚 Hold up right there!")
								.setDescription(
									`
								This command requires that you vote for ${bot.toString()} on [top.gg](https://top.gg/bot/1198639435395375164/vote)
								`
								)
								.addFields({
									name: "Why should I vote?",
									value: `
									By voting you show your support to the bot and it also allows for the bot to increase it's reaching on top.gg and best of all is that it's free!
										`,
								}),
						],
						components: [
							new ActionRowBuilder<ButtonBuilder>().setComponents(
								new ButtonBuilder()
									.setLabel("Vote to unlock feature")
									.setURL("https://top.gg/bot/1198639435395375164/vote")
									.setStyle(5)
									.setEmoji("🔓")
							),
						],
						ephemeral: true,
					});
				}
				const customEmbedData = data.customEmbed;
				const buttonData = data.customReviewButton;

				const generalCustomizeRow = [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("editEmbedColor")
							.setLabel("Edit Embed Color")
							.setStyle(1),
						new ButtonBuilder()
							.setLabel("Edit Button Label")
							.setCustomId("editLabelButton")
							.setStyle(1),
						new ButtonBuilder()
							.setLabel("Edit Button Color")
							.setCustomId("editColorButton")
							.setStyle(1)
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("saveCustomButton")
							.setLabel("Save")
							.setStyle(3),
						new ButtonBuilder()
							.setCustomId("cancelCustomButton")
							.setLabel("Cancel")
							.setStyle(4)
					),
				];

				const generalCustomizeEmbed = new EmbedBuilder()
					.setColor(customEmbedData.color as ColorResolvable)
					.setAuthor({
						name: interaction.guild!.name,
						iconURL: interaction.guild!.iconURL() || undefined,
					})
					.setDescription(`# Customize:\n`)
					.addFields(
						{
							name: "Embed Color",
							value: customEmbedData.color,
							inline: true,
						},
						{
							name: "Button Label",
							value: buttonData.label,
							inline: true,
						},
						{
							name: "Button Color",
							value: buttonData.color,
							inline: true,
						}
					);

				await interaction
					.reply({
						embeds: [generalCustomizeEmbed],
						components: generalCustomizeRow,
					})
					.then(async (int) => {
						const collector = int.createMessageComponentCollector({
							filter: (i) => i.user.id === interaction.user.id,
							componentType: ComponentType.Button,
							time: 1000 * 60 * 10,
						});

						collector.on("collect", async (buttonInt) => {
							const button = buttonInt.customId;

							switch (button) {
								case "editEmbedColor":
									{
										const editEmbedColorModal = new ModalBuilder()
											.setTitle("Edit Embed Color")
											.setCustomId("editEmbedColorModal")
											.setComponents(
												new ActionRowBuilder<TextInputBuilder>().setComponents(
													new TextInputBuilder()
														.setLabel("Color")
														.setCustomId("embedColorInput")
														.setPlaceholder("Enter a hex color (eg. #ffffff)")
														.setStyle(1)
														.setRequired(true)
														.setMaxLength(9)
														.setValue(customEmbedData.color)
												)
											);

										await buttonInt.showModal(editEmbedColorModal);

										await buttonInt
											.awaitModalSubmit({
												filter: (i) => i.customId === "editEmbedColorModal",
												time: 1000 * 60,
											})
											.then(async (modalInt) => {
												await modalInt.deferUpdate();

												const colorInput =
													modalInt.fields.getTextInputValue("embedColorInput");

												if (!validateHTMLColorHex(colorInput)) {
													await interaction.followUp({
														content:
															"You've provided an invalid color. Please try again.",
														ephemeral: true,
													});
													return;
												}

												customEmbedData.color = colorInput;

												generalCustomizeEmbed
													.setColor(colorInput as ColorResolvable)
													.setFields(
														{
															name: "Embed Color",
															value: customEmbedData.color,
															inline: true,
														},
														{
															name: "Button Label",
															value: buttonData.label,
															inline: true,
														},
														{
															name: "Button Color",
															value: buttonData.color,
															inline: true,
														}
													);

												await interaction.editReply({
													embeds: [generalCustomizeEmbed],
													components: generalCustomizeRow,
												});
											});
									}
									break;
								case "editLabelButton":
									{
										const editLabelModal = new ModalBuilder()
											.setTitle("Edit Label")
											.setCustomId("editLabelModal")
											.setComponents(
												new ActionRowBuilder<TextInputBuilder>().setComponents(
													new TextInputBuilder()
														.setLabel("Label")
														.setCustomId("labelInput")
														.setPlaceholder(
															"Enter the label to set on the button"
														)
														.setStyle(1)
														.setRequired(true)
														.setMaxLength(100)
														.setValue(buttonData.label)
												)
											);

										await buttonInt.showModal(editLabelModal);

										await buttonInt
											.awaitModalSubmit({
												filter: async (i) =>
													(await i.deferUpdate()) &&
													i.user.id === buttonInt.user.id,
												time: 1000 * 60,
											})
											.then(async (modalInt) => {
												const labelInput =
													modalInt.fields.getTextInputValue("labelInput");

												buttonData.label = labelInput;

												generalCustomizeEmbed.setFields(
													{
														name: "Embed Color",
														value: customEmbedData.color,
														inline: true,
													},
													{
														name: "Button Label",
														value: buttonData.label,
														inline: true,
													},
													{
														name: "Button Color",
														value: buttonData.color,
														inline: true,
													}
												);

												await interaction.editReply({
													embeds: [generalCustomizeEmbed],
													components: generalCustomizeRow,
												});
											})
											.catch();
									}
									break;

								case "editColorButton":
									{
										const editColorModal = new ModalBuilder()
											.setTitle("Edit Button Color")
											.setCustomId("editButtonColorModal")
											.addComponents(
												new ActionRowBuilder<TextInputBuilder>().setComponents(
													new TextInputBuilder()
														.setLabel("Color")
														.setCustomId("colorInput")
														.setPlaceholder("Blue | Grey | Green | Red")
														.setStyle(1)
														.setRequired(true)
														.setMaxLength(9)
														.setValue(buttonData.color)
												)
											);

										await buttonInt.showModal(editColorModal);

										await buttonInt
											.awaitModalSubmit({
												filter: (i) => i.customId === "editButtonColorModal",
												time: 1000 * 60 * 3,
											})
											.then(async (modalInt) => {
												await modalInt.deferUpdate();

												const colorInput =
													modalInt.fields.getTextInputValue("colorInput");

												const buttonColor =
													colorInput.charAt(0).toUpperCase() +
													colorInput.slice(1);

												if (
													!["Blue", "Grey", "Green", "Red"].includes(
														buttonColor
													)
												) {
													await buttonInt.reply({
														content: "Invalid color name provided.",
														ephemeral: true,
													});
													return;
												}

												buttonData.color = buttonColor;

												generalCustomizeEmbed.setFields(
													{
														name: "Embed Color",
														value: customEmbedData.color,
														inline: true,
													},
													{
														name: "Button Label",
														value: buttonData.label,
														inline: true,
													},
													{
														name: "Button Color",
														value: buttonData.color,
														inline: true,
													}
												);

												await interaction.editReply({
													embeds: [generalCustomizeEmbed],
													components: generalCustomizeRow,
												});
											})
											.catch();
									}
									break;

								case "saveCustomButton": {
									await data.save();

									generalCustomizeEmbed.setColor("Green");

									await interaction.editReply({
										embeds: [generalCustomizeEmbed],
										components: [
											new ActionRowBuilder<ButtonBuilder>().addComponents(
												new ButtonBuilder()
													.setLabel("Button Saved")
													.setCustomId("nn")
													.setStyle(3)
													.setDisabled(true)
											),
										],
									});
									break;
								}

								case "cancelCustomButton":
									{
										generalCustomizeEmbed.setColor("Red");
										generalCustomizeEmbed.setDescription(
											strikethrough(`# Customize:\n`)
										);
										generalCustomizeEmbed.setFields(
											{
												name: strikethrough("Embed Color"),
												value: strikethrough(customEmbedData.color),
												inline: true,
											},
											{
												name: strikethrough("Button Label"),
												value: strikethrough(buttonData.label),
												inline: true,
											},
											{
												name: strikethrough("Button Color"),
												value: strikethrough(buttonData.color),
												inline: true,
											}
										);

										await interaction.editReply({
											embeds: [generalCustomizeEmbed],
											components: [
												new ActionRowBuilder<ButtonBuilder>().addComponents(
													new ButtonBuilder()
														.setLabel("Cancelled")
														.setCustomId("nn")
														.setStyle(4)
														.setDisabled(true)
												),
											],
										});
									}
									break;
							}
						});

						collector.on("end", (c, r) => {
							if (r === "time") {
								generalCustomizeRow.forEach((components) => {
									components.components.forEach((component) => {
										component.setDisabled(true);
									});
								});
							}
						});
					})
					.catch();
			}
			break;
	}
}
