import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	TextChannel,
	ForumChannel,
	NewsChannel,
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
} from "discord.js";
import { createGuild, getOrCreateGuild } from "../../db";
import { validateHTMLColorHex } from "validate-color";

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
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
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

	switch (options.getSubcommand()) {
		case "channel":
			{
				const channel: TextChannel | NewsChannel | ForumChannel =
					options.getChannel("channel", true);
				data.channel = channel.id;
				await data.save();
				await interaction.reply({
					content: `Reviews will now be sent to ${channel.toString()}`,
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
					ephemeral: true,
				});
			}
			break;

		case "anonymous-reviews":
			{
				const toggle: string = options.getString("toggle", true);
				data.anonymousReviews = toggle === "yes" ? true : false;
				await data.save();
				await interaction.reply({
					content: `Anonymous reviews has been ${bold(
						toggle === "yes" ? "Enabled" : "Disabled"
					)}.`,
					ephemeral: true,
				});
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
						ephemeral: true,
					});
					return;
				}

				await data
					.deleteOne()
					.then(async () => await createGuild(interaction.guildId as string));

				await interaction.reply({
					content: "The configuration has been reset.",
					ephemeral: true,
				});
			}
			break;

		case "customize":
			{
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
