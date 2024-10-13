import { ClusterManager } from "discord-hybrid-sharding";
import { envParseString } from "@skyra/env-utilities";
import { postData } from "#manager/botlist/index";
import { ChildProcess } from "child_process";
import { Logger } from "#lib/logger";

import '#lib/database/mongodb';

const isProductionMode = envParseString('NODE_ENV') === "production";

const startupOptions = !isProductionMode ? {
	totalShards: 1, shardsPerClusters: 1
} : { totalShards: 32, shardsPerClusters: 8 }

const manager = new ClusterManager('./dist/main.js', {
	...startupOptions,
	execArgv: ['--trace-warnings', '--enable-source-maps'],
	mode: 'process',
	token: envParseString("DISCORD_TOKEN"),
});

manager.on('clusterCreate', cluster => {
	cluster.on('spawn', (child) => void (child as ChildProcess).send({ job: 'ready', value: cluster.id }));
	cluster.on('death', () => Logger.warn(`${cluster.id} has died`));
	cluster.on('error', (err) => Logger.error(err));
});


import express from 'express';
import cors from "cors";
import router from "./api/routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);

let resultCache: { time: null | number; result: null | object } = { time: null, result: null };


app.get('/api/status', async (_req, res) => {
	if (resultCache.time && Date.now() - resultCache.time < 5000) {
		return res.status(200).send(resultCache.result);
	}

	resultCache.time = Date.now();
	resultCache.result = await manager.broadcastEval(async (client) => {
		return {
			id: client.cluster.id,
			members: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
			guilds: client.guilds.cache.size,
			uptime: client.uptime,
		};
	});

	res.status(200).send(resultCache.result);
});

// app.get('/api/statistics/:guildId', async (req, res) => {
// 	const guildId = req.params.guildId;

// 	const data = await statisticsModel.find({
// 		guildId,
// 	});

// 	res.status(200).send(data);
// });

manager.spawn({ timeout: 10 * 1000 })
	.then(() => {
		Logger.info('All Shards ready');

		if (isProductionMode) {
			postData(manager);
		}

		app.listen(process.env.PORT, () => Logger.info(`Listening on port ${process.env.PORT}`));
	})
	.catch((error) => Logger.error(error))