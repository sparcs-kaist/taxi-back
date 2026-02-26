import crypto from "crypto";
import { roomModel } from "@/modules/stores/mongo";

const timeWindow = 1000 * 60 * 30; // 30분
const emojis = [
  "apple", // 🍎
  "orange", // 🍊
  "lemon", // 🍋
  "watermelon", // 🍉
  "grape", // 🍇
  "strawberry", // 🍓
  "cherry", // 🍒
  "pineapple", // 🍍
  "kiwi", // 🥝
  "coconut", // 🥥
  "peach", // 🍑
  "banana", // 🍌
  "carrot", // 🥕
  "corn", // 🌽
  "broccoli", // 🥦
  "mushroom", // 🍄
];

export const allocateEmojiIdentifier = async (departureTime: Date) => {
  const nearbyRooms = await roomModel
    .find(
      {
        time: {
          $gte: departureTime.getTime() - timeWindow,
          $lte: departureTime.getTime() + timeWindow,
        },
      },
      "emojiIdentifier"
    )
    .lean();

  const usedEmojis = new Set(
    nearbyRooms
      .map((room) => room.emojiIdentifier)
      .filter((identifier): identifier is string => Boolean(identifier))
  );
  const availableEmojis = emojis.filter((emoji) => !usedEmojis.has(emoji));

  return availableEmojis.length > 0
    ? availableEmojis[crypto.randomInt(availableEmojis.length)]
    : undefined;
};
