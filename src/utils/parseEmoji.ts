import { parseEmoji } from "discord.js";

export const parseEmojiWithFallback = (emoji: string) => {
  const parsedEmoji = parseEmoji(emoji);

  if (parsedEmoji) {
    return parsedEmoji;
  }

  const match = emoji.match(/<:.+?:(\d+)>/);
  if (match) {
    return {
      id: match[1],
      name: null,
      animated: false,
    };
  }

  return null;
};
