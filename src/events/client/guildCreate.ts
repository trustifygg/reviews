import type { ClientEvents } from '#types/events';

import { settingsModel } from '#model/guild';

const guildCreateEvent: ClientEvents['GuildCreate'] = async (guild) => {
	const data = await settingsModel.findOne({ guildId: guild.id });
	if (data) return;
	await settingsModel.create({
		guildId: guild.id,
		prefixes: ['r!'],
	});
};

export default guildCreateEvent;
