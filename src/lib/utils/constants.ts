import { PermissionFlagsBits } from 'discord.js';

export const Constants = {
	primaryColor: 0x8f7cfc,

	supportInviteLink: 'https://discord.gg/J9bTk96RRX',
	DISCORD_ENDPOINT: 'https://discord.com/api/v10',

	owners: ['953834900870557768'] as string[],
	ownerGuild: '1264556818793758730',
	bugRole: '933401182758658108',
	errorRole: '933579864026525716',
	// eslint-disable-next-line unicorn/no-unsafe-regex -- safe for our use case
	imageRegex: /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i,
	removeExcRegex: /(?<=^|<@)!(?=\d{17,19}>|$)/g,

	emojis: {
		bad: '<:bad:1321815240840577044>',
		neutral: '<:neutral:1321815230325461022>',
		good: '<:good:1321811188551647273>',
		empty: '<:empty:1321811112781549658>',
	},
} as const;

export const keyPermissions = [
	PermissionFlagsBits.ManageRoles,
	PermissionFlagsBits.ManageChannels,
	PermissionFlagsBits.ManageThreads,
	PermissionFlagsBits.ManageMessages,
];
