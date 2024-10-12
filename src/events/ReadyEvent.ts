import { ActivityType, Client } from "discord.js";
import { IEvent } from "../lib/modules/EventHandler";
import { Logger } from "../lib/logger";

export default class ReadyEvent implements IEvent<"ready"> {
	public event = "ready" as const;

	public async execute(client: Client): Promise<void> {
		Logger.info(`└─ Logged in as ${client.user!.tag}.`);

		client.user?.setActivity({
			name: "Development",
			type: ActivityType.Watching,
		});
	}
}
