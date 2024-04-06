// import { ReviewDB } from "../database/models";

export const generateReviewId = (): string => {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";

	for (let i = 0; i < 7; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
};

// export const generateReviewId = (length: number): string => {
// 	let id = generateRandomId(length);

// 	while (ReviewDB.find({ reviewId: id })) {
// 		id = generateRandomId(length);
// 	}

// 	return id;
// };

// const generateRandomId = (length: number): string => {
// 	const characters =
// 		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
// 	let id = "";

// 	for (let i = 0; i < length; i++) {
// 		const randomIndex = Math.floor(Math.random() * characters.length);
// 		id += characters.charAt(randomIndex);
// 	}

// 	return id;
// };
