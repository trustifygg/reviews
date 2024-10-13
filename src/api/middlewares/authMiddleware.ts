import Express from 'express';

export const authMiddleware = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
	const refererHeader = req.headers.Referer as string;
	if (refererHeader) {
		const referer = new URL(refererHeader);
		if (referer.hostname === 'rotibot.xyz') return next();
	} else {
		return res.redirect('https://rotibot.xyz/');
	}
};
