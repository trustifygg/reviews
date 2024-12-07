import { ClusterManager } from 'discord-hybrid-sharding';
import { envParseString } from '@skyra/env-utilities';
import { postData } from '#manager/botlist/index';
import { ChildProcess } from 'child_process';
import { Logger } from '#lib/logger';

import '#lib/database/mongodb';

const isProductionMode = envParseString('NODE_ENV') === 'production';

const startupOptions = !isProductionMode
	? {
			totalShards: 1,
			shardsPerClusters: 1,
		}
	: { totalShards: 32, shardsPerClusters: 8 };

const manager = new ClusterManager('./dist/main.js', {
	...startupOptions,
	execArgv: ['--trace-warnings', '--enable-source-maps'],
	mode: 'process',
	token: envParseString('DISCORD_TOKEN'),
});

manager.on('clusterCreate', (cluster) => {
	cluster.on('spawn', (child) => void (child as ChildProcess).send({ job: 'ready', value: cluster.id }));
	cluster.on('death', () => Logger.warn(`${cluster.id} has died`));
	cluster.on('error', (err) => Logger.error(err));
});

import express from 'express';
import cors from 'cors';

const app = express();

app
	.use(express.json())
	.use(express.urlencoded({ extended: true }))
	.use(
		cors({
			credentials: true,
			origin: 'http://localhost:3000',
		})
	);

let resultCache: { time: null | number; result: null | object } = { time: null, result: null };

app.get('/api/status', async (_req, res) => {
	if (resultCache.time && Date.now() - resultCache.time < 5000) {
		return res.status(200).send(resultCache.result);
	}

	resultCache.time = Date.now();
	const results = await manager.broadcastEval(async (client) => {
		const guildData = await Promise.all(
			client.guilds.cache.map((guild) => {
				return {
					shardId: guild.shardId,
					memberCount: guild.memberCount,
					uptime: client.uptime,
					status: client.ws.status === 0 ? 'operational' 
						: client.ws.status === 1 ? 'partial'
						: 'offline'
				};
			})
		);
		return guildData;
	});

	const flattenedResults = results.flat();
	const shardCounters = new Map<number, number>();

	const data = await flattenedResults.reduce((acc: any[], current: any) => {
		if (!shardCounters.has(current.shardId)) {
			shardCounters.set(current.shardId, 0);
		}

		const counter = shardCounters.get(current.shardId)!;
		shardCounters.set(current.shardId, counter + 1);
		const existing = acc.find((item: any) => item.shardId === current.shardId);

		if (existing) {
			existing.memberCount += current.memberCount;
			existing.uptime = Math.max(existing.uptime, current.uptime);
			existing.guildCount += 1;
			existing.status = current.status === 'offline' || existing.status === 'offline' ? 'offline'
				: current.status === 'partial' || existing.status === 'partial' ? 'partial'
				: 'operational';
		} else {
			acc.push({
				shardId: current.shardId,
				guildCount: 1,
				memberCount: current.memberCount,
				uptime: current.uptime,
				status: current.status
			});
		}
		return acc;
	}, []);

	const totalShards = manager.totalShards;
	for (let i = 0; i < totalShards; i++) {
		if (!data.find(shard => shard.shardId === i)) {
			data.push({
				shardId: i,
				guildCount: 0,
				memberCount: 0,
				uptime: 0,
				status: 'offline'
			});
		}
	}

	const totalMembers = data.reduce((acc, result) => acc + result.memberCount, 0);
	const totalGuilds = data.reduce((acc, result) => acc + result.guildCount, 0);
	const averageUptime = data.reduce((acc, result) => acc + (result.uptime ?? 0), 0) / results.length;

	resultCache.result = {
		shards: data.sort((a, b) => a.shardId - b.shardId),
		totalMembers,
		totalGuilds,
		averageUptime,
	};

	return res.status(200).json(resultCache.result);
});

app.get('/api/status/top', async (_req, res) => {
	try {
		const results = await manager.broadcastEval(async (client) => {
			const topGuilds = client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).first(50);

			return topGuilds.map((guild) => ({
				id: guild.id,
				name: guild.name,
				avatar: guild.iconURL({ size: 1024 }),
				memberCount: guild.memberCount,
			}));
		});

		const topGuilds = results.flat();

		const overallTopGuilds = topGuilds.sort((a, b) => b.memberCount - a.memberCount).slice(0, 50);

		return res.status(200).json(overallTopGuilds);
	} catch (error) {
		return res.status(500).send({ error: 'Error fetching top guilds' });
	}
});

// app.get('/api/statistics/:guildId', async (req, res) => {
// 	const guildId = req.params.guildId;

// 	const data = await statisticsModel.find({
// 		guildId,
// 	});

// 	res.status(200).send(data);
// });

manager
	.spawn({ timeout: 10 * 1000 })
	.then(() => {
		Logger.info('All Shards ready');

		if (isProductionMode) {
			postData(manager);
		}

		app.listen(process.env.PORT, () => Logger.info(`API started on port ${process.env.PORT}`));
	})
	.catch((error) => Logger.error(error));
