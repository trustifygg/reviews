import { Time } from '@imranbarbhuiya/duration';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionsBitField,
	StringSelectMenuBuilder,
	SlashCommandBuilder,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type Client,
	type Message,
	type MessageActionRowComponentBuilder,
} from 'discord.js';
import { Pagination } from 'pagination.djs';

import type { CommonCommand } from '#types/command';
import type { InteractionResponse } from 'discord.js';
import type { PButtonBuilder } from 'pagination.djs';

import { ApplyCommandOption, Command } from '#structure/Command';
import { findBestMatch } from '#util/bestmatch';
import { Constants } from '#util/constants';
import { disableAll } from '#util/disableAll';
import { authorOrUser, toTitleCase } from '#util/utils';

const addEmojiInDescription = (c: CommonCommand & { description: string }) => {
	if (c.category === 'moderation') {
		return `<:roti_yellow_sign:1072530247762837616>  ${c.description || 'No description provided'}`;
	}

	return `<:roti_arrow:1072530249696432159>  ${c.description || 'No description provided'}`;
};

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays a list of available commands')
		.addStringOption((opt) =>
			opt.setName('command').setDescription('Name of the command that you need help with').setAutocomplete(true)
		),
	{ id: '924143695379439664', allowDM: true }
)
export class UserCommand extends Command {
	private readonly limit = 7;

	public override async autocompleteRun(
		interaction: AutocompleteInteraction,
		options: AutocompleteInteraction['options'],
		client: Client<true>
	) {
		const chatInputCommandsList = client.chatInputCommands
			.filter((c) => !c.ownerOnly)
			.filter(
				(c) =>
					c.name.startsWith(options.getFocused()) ||
					c.name.includes(options.getFocused()) ||
					c.aliases.some((alias) => alias.startsWith(options.getFocused()))
			)
			.map((c) => ({
				name: c.name,
				value: c.name,
			}));
		const helpCommandsList = client.helpCommands
			.filter(
				(c) =>
					(c.name.startsWith(options.getFocused()) ||
						c.name.includes(options.getFocused()) ||
						c.aliases?.some((alias) => alias.startsWith(options.getFocused()))) ??
					false
			)
			.map((c) => ({
				name: c.name,
				value: c.name,
			}));
		const commands = [...chatInputCommandsList, ...helpCommandsList]
			.filter((c, index, self) => index === self.findIndex((t) => t.name === c.name))
			.slice(0, 25);
		await interaction.respond(commands);
	}

	protected override async runTask(
		messageOrInteraction: ChatInputCommandInteraction<'cached'> | Message<true>,
		options: Command.ChatInputOptions,
		client: Client<true>,
		prefix: string = '/'
	) {
		const commandName = options.getString('command');
		const embed = new EmbedBuilder()
			.setColor(Constants.primaryColor)
			.setTitle(`${client.user.username} Help`)
			.setFooter({
				text: `Requested by ${authorOrUser(messageOrInteraction).tag}`,
				iconURL: messageOrInteraction.member?.displayAvatarURL(),
			})
			.setTimestamp();

		if (!commandName) {
			return this.showMainMenu(messageOrInteraction, client, embed, prefix);
		}

		const allCommands = [
			...client.helpCommands.values(),
			...client.chatInputCommands.filter((c) => !c.ownerOnly).values(),
		];
		const allCmdNames = allCommands.map((c) => c.name);
		const allCmdAliases = allCommands.flatMap((c) => c.aliases ?? []);

		const cmd = allCommands.find((c) => c.name === commandName || c.aliases?.includes(commandName));

		if (!cmd) {
			const bestMatch = findBestMatch(commandName, [...allCmdNames, ...allCmdAliases]).target;
			return messageOrInteraction.reply({
				embeds: [
					embed.setDescription(
						`Couldn't find a command named \`${commandName}\`. Did you mean __**${bestMatch}**__ instead?` +
						`\nType \`${prefix}help\` to see all the available commands.`
					),
				],
			});
		}

		embed.addFields(
			{
				name: `Name${Constants.emojis.colon}`,
				value: `${cmd.name}`,
				inline: true,
			},
			{
				name: `Category${Constants.emojis.colon}`,
				value: `${toTitleCase(cmd.category!)}`,
				inline: true,
			},
			{
				name: `Description${Constants.emojis.colon}`,
				value: `${cmd.longDescription ?? (cmd.description || '`Not provided`')}`,
			},
			{
				name: `Usage${Constants.emojis.colon}`,
				value: cmd.usage
					? `${cmd.usage.replaceAll('{p}', prefix)}\noptional arguments are shown in italic.`
					: cmd.id
						? `</${cmd.name}:${cmd.id}>`
						: '`Not provided`',
			},
			{
				name: `Availability${Constants.emojis.colon}`,
				value: `\`${cmd.availability ?? 'Slash Command only'}\``,
			},
			{
				name: `Cooldown${Constants.emojis.colon}`,
				value: `${cmd.cooldown ?? 0}s`,
				inline: true,
			}
		);
		if (cmd.aliases?.length) {
			embed.addFields({
				name: `Aliases${Constants.emojis.colon}`,
				value: `\`${cmd.aliases.join('` `')}\``,
			});
		}

		if (cmd.userPermissions?.length) {
			embed.addFields({
				name: `User Permissions${Constants.emojis.colon}`,
				value: toTitleCase(
					new PermissionsBitField(
						typeof cmd.userPermissions === 'string' ? BigInt(cmd.userPermissions) : cmd.userPermissions
					)
						.toArray()
						.join(', ')
				),
				inline: true,
			});
		}

		if (cmd.botPermissions?.length) {
			embed.addFields({
				name: `Bot Permissions${Constants.emojis.colon}`,
				value: toTitleCase(new PermissionsBitField(cmd.botPermissions).toArray().join(', ')),
				inline: true,
			});
		}

		if (cmd.examples) {
			embed.addFields({
				name: `Examples${Constants.emojis.colon}`,
				value: `${cmd.examples}`,
			});
		}

		await messageOrInteraction.reply({
			embeds: [embed],
		});
	}

	protected override transformArgs(_message: Message, args: string[]): Command.ChatInputOptions {
		const options: Partial<Command.ChatInputOptions> = {
			getString: () => args.join(' '),
		};
		return options as Command.ChatInputOptions;
	}

	private async showMainMenu(
		messageOrInteraction: ChatInputCommandInteraction<'cached'> | Message<true>,
		client: Client<true>,
		embed: EmbedBuilder,
		prefix: string
	) {
		const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>();
		const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>();
		const row3 = new ActionRowBuilder<MessageActionRowComponentBuilder>();
		const row4 = new ActionRowBuilder<MessageActionRowComponentBuilder>();

		const row1Menu = new StringSelectMenuBuilder()
			.setPlaceholder('Server Management')
			.setCustomId('filter-server-management')
			.setOptions(
				{
					label: 'Configuration',
					emoji: Constants.categoryEmojis.configuration,
					description: 'Filter configuration commands',
					value: 'configuration',
				},
				{
					label: 'Logs',
					emoji: Constants.categoryEmojis.logs,
					description: 'Filter log commands',
					value: 'logs',
				},
				{
					label: 'Ticket',
					emoji: Constants.categoryEmojis.ticket,
					description: 'Filter ticket commands',
					value: 'ticket',
				},
				{
					label: 'Suggestion',
					emoji: Constants.categoryEmojis.suggestion,
					description: 'Filter suggestion commands',
					value: 'suggestion',
				},
				{
					label: 'Tags and Triggers',
					emoji: Constants.categoryEmojis['tags and triggers'],
					description: 'Filter tags & triggers commands',
					value: 'tags and triggers',
				}
			)
			.setMinValues(1)
			.setMaxValues(5);

		const row2Menu = new StringSelectMenuBuilder()
			.setPlaceholder('User Management')
			.setCustomId('filter-user-management')
			.setOptions(
				{
					label: 'Moderation',
					emoji: Constants.categoryEmojis.moderation,
					description: 'Filter moderation commands',
					value: 'moderation',
				},
				{
					label: 'Role Administration',
					emoji: Constants.categoryEmojis.role,
					description: 'Filter role(s) related commands',
					value: 'role',
				},
				{
					label: 'Automod',
					emoji: Constants.categoryEmojis.automod,
					description: 'Filter automod related commands',
					value: 'automod',
				}
			)
			.setMinValues(1)
			.setMaxValues(3);

		const row3Menu = new StringSelectMenuBuilder()
			.setPlaceholder('Fun & Utilities')
			.setCustomId('filter-fun-and-utilities')
			.setOptions(
				{
					label: 'Core',
					emoji: Constants.categoryEmojis.core,
					description: 'Filter core commands',
					value: 'core',
				},
				{
					label: 'Miscellaneous',
					emoji: Constants.categoryEmojis.misc,
					description: 'Filter misc commands',
					value: 'misc',
				},
				{
					label: 'Utility',
					emoji: Constants.categoryEmojis.utility,
					description: 'Filter utility commands',
					value: 'utility',
				},
				{
					label: 'Giveaway',
					emoji: Constants.categoryEmojis.giveaway,
					description: 'Filter giveaway commands',
					value: 'giveaway',
				},
				{
					label: 'Fun',
					description: 'Filter fun commands',
					emoji: Constants.categoryEmojis.fun,
					value: 'fun',
				},
				{
					label: 'Highlight',
					emoji: Constants.categoryEmojis.highlight,
					description: 'Filter highlight commands',
					value: 'highlight',
				},
				{
					label: 'Mini Games',
					emoji: Constants.categoryEmojis.minigame,
					description: 'Filter mini-game commands',
					value: 'minigame',
				}
			)
			.setMinValues(1)
			.setMaxValues(7);

		const docs = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Docs').setURL('https://docs.rotibot.xyz');
		const supportserver = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setLabel('Support server')
			.setURL('https://discord.gg/w5b7dYRMZH');

		row1.setComponents(row1Menu);
		row2.setComponents(row2Menu);
		row3.setComponents(row3Menu);
		row4.setComponents(docs, supportserver);

		const components = [row1, row2, row3, row4];

		const rawFields: {
			category?: string;
			name: string;
			usage?: string;
			value: string;
		}[] = [];

		for (const c of client.helpCommands.values()) {
			rawFields.push({
				name: `${Constants.categoryEmojis[c.category as keyof (typeof Constants)['categoryEmojis']]} ${c.name}`,
				value: addEmojiInDescription(c),
				category: c.category,
				usage: c.usage,
			});
		}

		for (const c of client.chatInputCommands.filter((c) => !c.ownerOnly && !c.private).values()) {
			if (!client.helpCommands.get(c.name)) {
				rawFields.push({
					name: `${Constants.categoryEmojis[c.category as keyof (typeof Constants)['categoryEmojis']]} ${c.name}`,
					value: addEmojiInDescription(c),
					category: c.category,
					usage: c.usage,
				});
			}
		}

		let fields = rawFields.sort((a, b) => {
			const aName = a.name;
			const bName = b.name;
			if (aName < bName) return -1;
			if (aName > bName) return 1;
			return 0;
		});

		const interactionResponse = (await messageOrInteraction.reply({
			embeds: [
				embed.setDescription(
					`\n<:roti_moon:1105765122632327189> ${client.user}\n\n` +
					'Elevate your discord experience with R.O.T.I,\nA versatile and powerful bot packed with features!\n\n' +
					'**Commands are grouped into categories**\n' +
					`Use \`${prefix}help\` to get help for a specific command\n\n> \n` +
					`> Invite the bot using \`${prefix}invite\` command` +
					`\n> \n\nJoin our **[server](${Constants.supportInviteLink})** for updates, \nsupport and fantastic giveaways.`
				),
			],
			components,
		})) as InteractionResponse<true>;
		const user = authorOrUser(messageOrInteraction);
		const collector = interactionResponse.createMessageComponentCollector({
			idle: 5 * Time.Minute,
		});
		const pagination = new Pagination(messageOrInteraction, {
			...Constants.emojis,
			limit: this.limit,
		})
			.paginateFields()
			.addActionRows(components)
			.setColor(Constants.primaryColor);

		pagination.buttons = {
			first: pagination.buttons.first,
			prev: pagination.buttons.prev,
			middle: new ButtonBuilder()
				.setCustomId(`exit-${user.id}`)
				.setLabel('Exit')
				.setStyle(ButtonStyle.Danger) as PButtonBuilder,
			next: pagination.buttons.next,
			last: pagination.buttons.last,
		};

		let paginated = false;
		collector.on('collect', async (i) => {
			if (i.user.id !== user.id) {
				i.deferUpdate().catch(() => null);
				return;
			}

			if (!i.isStringSelectMenu()) return;
			if (i.customId.startsWith('filter')) {
				fields = rawFields.filter((field) => i.values.includes(field.category!));
				pagination.currentPage = 1;
				const payload = pagination
					.setTitle(`${client.user.username} Help - ${i.values.join(', ')}`)
					.setFields(fields)
					.ready();
				await i.update(payload).catch(() => null);
				if (!paginated) {
					pagination.paginate(interactionResponse);
					paginated = true;
				}
			}
		});
		collector.on('end', (collected) => {
			const msg = collected.first()?.message;
			msg?.edit({ components: disableAll(msg.components) }).catch(() => null);
		});
	}
}
