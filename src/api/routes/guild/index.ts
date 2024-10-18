import { guildModel, IGuild } from '#model/guild';
import { statisticsModel } from '#model/statistics';
import { Request, Response, Router } from 'express';

const router = Router();

interface GuildRequest extends Request {
	params: {
		guildId: string;
	};
}

router.get('/stats/:guildId', async (req: GuildRequest, res: Response) => {
	const guildId = req.params.guildId;

	const data = await statisticsModel.find({
		guildId,
	});

	res.status(200).send(data);
});

router.get('/config/:guildId', async (req: GuildRequest, res: Response) => {
	const guildId = req.params.guildId;

	const data = await guildModel.findOne({ guildId });

	res.status(200).send(data);
});

interface ConfigUpdateRequest extends GuildRequest {
	body: Partial<IGuild>;
}

router.patch('/config/:guildId', async (req: ConfigUpdateRequest, res: Response) => {
  const { guildId } = req.params;
  const updateData = req.body;

  try {
    const data: IGuild | null = await guildModel.findOneAndUpdate(
      { guildId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!data) {
			new guildModel({ guildId, ...updateData }).save();
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: 'Error updating guild configuration', error: (error as Error).message });
  }
});

export default router;
