import { IUser, userModel } from '#model/users';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
	userId: string;
	[key: string]: any;
}

declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		console.log(req.cookies);

		const token = req.cookies?.token;

		if (!token) {
			return next(); // If no token, just move to the next middleware
		}

		const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

		if (decodedToken?.userId) {
			const targetUser = await userModel.findOne({ userId: decodedToken.userId }).lean();
			if (targetUser) {
				req.user = targetUser;
				console.log('auth middleware', req.user);
			}
		}

		next();
	} catch (err) {
		console.error('Auth middleware error:', err);
		// In case of an error (e.g., invalid token), clear the token and proceed
		res.clearCookie('token');
		next();
	}
};

export default authMiddleware;
