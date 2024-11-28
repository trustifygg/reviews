import type { ClientEvents } from '#types/events';

import { guildModel } from '#model/guild';

const guildCreateEvent: ClientEvents['GuildCreate'] = async (guild) => {
	const data = await guildModel.findOne({ guildId: guild.id });
	if (data) return;
	await guildModel.create({
		guildId: guild.id,
		name: guild.name,
		iconURL: guild.iconURL(),
	});
};

export default guildCreateEvent;
