import { PermissionFlagsBits } from 'discord.js';
import twemojiRegex from 'twemoji-parser/dist/lib/regex.js';

export const Constants = {
	// colors
	primaryColor: 0x8f7cfc,
	// server invite link
	supportInviteLink: 'https://discord.gg/w5b7dYRMZH',

	// emoji setup
	emojis: {
		verified: '<:roti_verified:1073113746634973246>',
		exit: '<:roti_next:1071466374154702991>',
		success: '<:roti_tick:1241004577755631766>',
		error: '<:roti_cross:1071466156357079120>',
		dice: `<:roti_fun:1105764367808606229>`,
		// warning: "⚠️",
		// info: "ℹ️",
		loading: '<a:roti_loading:1072530265659940994>',
		colon: '<:roti_green_colon:1072530243690168370>',
		redColon: '<:roti_red_colon:1072530251919405197>',
		greenDot: '<:roti_green_dot:1072530241475592272>',
		redDot: '<:roti_red_dot:1072530271309664376>',
		yellowDot: '<:roti_yellow_sign:1072530247762837616>',
		firstEmoji: '<:roti_first:1071466172194762782>',
		prevEmoji: '<:roti_previous:1071466393121337364>',
		nextEmoji: '<:roti_next:1071466374154702991>',
		rotimoon: `<:roti_moon:1105765122632327189>`,
		lastEmoji: '<:roti_last:1071466241014890506>',
		upEmoji: '🔼',
		downEmoji: '🔽',
	},
	categoryEmojis: {
		automod: '<:roti_automod:1105764351509532744>',
		configuration: '<:roti_configuration:1105764361345171476>',
		core: '<:roti_core:1105764365178781747>',
		fun: '<:roti_fun:1105764367808606229>',
		giveaway: '<:roti_giveaway:1105764372111953940>',
		highlight: '<:roti_highlight:1079088915010568293>',
		logs: '<:roti_logs:1105764378311143474>',
		minigame: '<:roti_minigames:1105764386909470730>',
		misc: '<:roti_misc:1105764393096069120>',
		moderation: '<:roti_moderation:1105764396942241852>',
		role: '<:roti_role:1105764399815344210>',
		suggestion: '<:roti_suggestion:1105764403929948230>',
		'tags and triggers': '<:roti_tag_trigger:1105764410456277064>',
		thread: '<:roti_thread:1071466477472989235>',
		ticket: '<:roti_ticket:1105764414856101958>',
		utility: '<:roti_utility:1105764419247542362>',
	},

	owners: ['215712513067712513', '582755860405551113', '528627987667615755', '1203434269565788211', '842620032960823327'] as string[],
	ownerGuild: '933368398996447292',
	bugRole: '933401182758658108',
	errorRole: '933579864026525716',
	// eslint-disable-next-line unicorn/no-unsafe-regex -- safe for our use case
	emojiRegex: /<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/g,
	twemojiRegex,
	imageRegex: /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i,
	removeExcRegex: /(?<=^|<@)!(?=\d{17,19}>|$)/g,
} as const;

export const keyPermissions = [
	PermissionFlagsBits.Administrator,
	PermissionFlagsBits.ManageGuild,
	PermissionFlagsBits.ManageRoles,
	PermissionFlagsBits.ManageChannels,
	PermissionFlagsBits.ManageThreads,
	PermissionFlagsBits.ModerateMembers,
	PermissionFlagsBits.ManageMessages,
	PermissionFlagsBits.ManageWebhooks,
	PermissionFlagsBits.ManageNicknames,
	PermissionFlagsBits.ManageGuildExpressions,
	PermissionFlagsBits.KickMembers,
	PermissionFlagsBits.BanMembers,
	PermissionFlagsBits.ViewAuditLog,
	PermissionFlagsBits.MentionEveryone,
];