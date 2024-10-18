import { hasPermission } from "#root/api/controller/permission";
import { Guild } from "discord.js";
import { Request, Response, Router } from "express";

const router = Router();

const DISCORD_ENDPOINT = 'https://discord.com/api/v10';

router.get('/', async (req: any, res: any) => {
  if (req.user) {
    const { accessToken, refreshToken, ...user } = req.user;

    res.status(200).json(user);
  } else {
    res.status(401).json({ message: 'Not logged in'});
  }
})

router.get('/guilds', async (req: any, res: any) => {
  if (!req.user?.accessToken) {
    res.status(401).json({ message: 'Not logged in'});
  }

  const guildsRes = await fetch(`${DISCORD_ENDPOINT}/users/@me/guilds`, {
    headers: {
      'Authorization': `Bearer ${req.user?.accessToken}`
    }
  });

  if (!guildsRes.ok) {
    res.status(500).json({ message: 'Error fetching guilds' });
  }

  const guilds = await guildsRes.json();

  const filteredGuilds = guilds.filter((guild: any) =>{
    hasPermission(guild.permissions, 'ManageGuild');
  });

  res.status(200).json(filteredGuilds);
})

export default router;