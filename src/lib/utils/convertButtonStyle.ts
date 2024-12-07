import { ButtonStyle } from "discord.js";

export const convertButtonStyle = (styleString: string): ButtonStyle => {
	switch (styleString.toLowerCase()) {
		case "primary":
		case "blue":
			return ButtonStyle.Primary;
		case "secondary":
		case "grey":
			return ButtonStyle.Secondary;
		case "success":
		case "green":
			return ButtonStyle.Success;
		case "danger":
		case "red":
			return ButtonStyle.Danger;
		default:
			return ButtonStyle.Primary;
	}
};