import { guildModel } from '#model/guild';
import { statisticsModel } from '#model/statistics';
import { Router } from 'express';

const router = Router();

router.get('/stats/:guildId', async (req, res) => {
	const guildId = req.params.guildId;

	const data = await statisticsModel.find({
		guildId,
	});

	res.status(200).send(data);
});

router.get('/config/:guildId', async (req, res) => {
	const guildId = req.params.guildId;

	const data = await guildModel.findOne({ guildId });

  res.status(200).send(data);
});

export default router;
