import { userModel } from '#model/users';
import jwt from 'jsonwebtoken';
import { Request, Response, Router } from 'express';

const router = Router();

router.get('/login', async (req: Request, res: Response) => {
	res.redirect(
		'https://discord.com/oauth2/authorize?client_id=1192638542409646120&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fcallback&scope=identify+guilds'
	);
});

router.get('/callback', async (req: Request, res: Response) => {
	const DISCORD_ENDPOINT = 'https://discord.com/api/v10';
	const CLIENT_ID = process.env.CLIENT_ID!;
	const CLIENT_SECRET = process.env.CLIENT_SECRET!;
	const REDIRECT_URI = process.env.REDIRECT_URI!;

	const code = req.query.code as string;

	if (!code) {
		return res.status(400).json({ message: 'Missing "code" query parameter' });
	}

	const oauthRes = await fetch(`${DISCORD_ENDPOINT}/oauth2/token`, {
		method: 'POST',
		body: new URLSearchParams({
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			grant_type: 'authorization_code',
			redirect_uri: REDIRECT_URI,
			code,
		}).toString(),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	});

	if (!oauthRes.ok) {
		console.error(`Error: `, oauthRes);
		res.send('error');
		return;
	}

	const oauthResJson = await oauthRes.json();

	const userRes = await fetch(`${DISCORD_ENDPOINT}/users/@me`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Bearer ${oauthResJson.access_token}`,
		},
	});

	if (!userRes.ok) {
		return res.send('error');
	}

	const userJson = await userRes.json();

	let user = await userModel.findOne({ userId: userJson.id });

	if (!user) {
		user = new userModel({
			userId: userJson.id,
			username: userJson.username,
			avatarHash: userJson.avatar,
			accessToken: oauthResJson.access_token,
			refreshToken: oauthResJson.refresh_token,
		});
	} else {
		user.username = userJson.username;
		user.accessToken = oauthResJson.access_token;
		user.refreshToken = oauthResJson.refresh_token;
		user.avatarHash = userJson.avatar;
	}

	await user.save();

	const token = jwt.sign(
		{
			userId: user.userId,
			username: user.username,
			avatarHash: user.avatarHash,
		},
		process.env.JWT_SECRET! as string,
		{
			expiresIn: '7d',
		}
	);

	res
		.status(200)
		.cookie('token', token, {
			domain: 'localhost',
			httpOnly: true,
			// expires: new Date(Date.now() + 6.048e8),
			secure: false,
			maxAge: 6.048e8,
			// sameSite: ''
		})
		.redirect('http://localhost:3000');
});

router.get('/logout', async (req: Request, res: Response) => {
	res.clearCookie('token').sendStatus(200);
});

export default router;
