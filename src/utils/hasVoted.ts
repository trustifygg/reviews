import axios from "axios";
import { log } from "..";

interface VotedResponse {
	voted: boolean;
	isWeekend: boolean;
	vote: {
		userId: string;
		botId: string;
	};
}

export const checkIfUserVoted = async (
	userId: string,
): Promise<boolean> => {
	try {
		const res = await axios.get<VotedResponse>(
			`https://top.gg/api/bots/1198639435395375164/check?userId=${userId}`,
			{
				headers: {
					Authorization: process.env.TOPGGTOKEN,
				},
			}
		);

		return res.data.voted;
	} catch (err) {
		log.error("An error occured with checking user's vote", err);
		return false;
	}
};
