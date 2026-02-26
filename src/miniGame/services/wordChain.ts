import {
  wordChainModel,
  dictionaryModel,
  miniGameModel,
} from "../modules/mongo";
import { userModel, roomModel } from "@/modules/stores/mongo";
import { emitChatEvent } from "@/modules/socket";
import { Server } from "socket.io";
import { Types } from "mongoose";
import logger from "@/modules/logger";

import { minigameReward, eventPeriod } from "@/lottery/modules/minigameReward";

const wordChainTimeouts: Map<string, NodeJS.Timeout> = new Map();

const TIMEOUT_MS = 15 * 1000;

const JudgeTimeout = async (io: Server, roomId: Types.ObjectId) => {
  const roomIdStr = roomId.toString();
  const game = await wordChainModel.findOne({
    roomId: roomId,
    finished: false,
  });
  if (!game) {
    return; // This won't be triggered because there is no finished game until JudgeTimeout is called.
  }
  const now = Date.now();
  if (now - game.updatedAt.getTime() < TIMEOUT_MS) {
    return; // already updated
  }

  const droppedPlayerId = game.players[game.currentPlayerIndex];
  const droppedPlayer = await userModel.findById(droppedPlayerId);
  const playerName = droppedPlayer ? droppedPlayer.nickname : "알 수 없음";
  game.players.splice(game.currentPlayerIndex, 1);

  await emitChatEvent(io, {
    roomId,
    type: "wordChain",
    content: `시간 초과로 인해 ${playerName}(이)가 탈락했습니다.`,
  });

  if (game.players.length === 1) {
    game.finished = true;
    await game.save();

    const winnerId = game.players[0];
    const winner = await userModel.findById(winnerId);
    const winnerName = winner ? winner.nickname : "알 수 없음";

    if (!winner) {
      logger.error(
        "there is no winner even though there is a player left. How it can be..."
      );
      return;
    }

    // 이벤트 코드입니다.
    const timestamp = Date.now();
    if (
      eventPeriod &&
      timestamp < eventPeriod.endAt &&
      timestamp >= eventPeriod.startAt
    ) {
      minigameReward(
        Math.min(800, game.usedWords.length * 8),
        winner._id.toString(),
        "wordChain"
      );
    }

    await emitChatEvent(io, {
      roomId,
      type: "wordChain",
      content: `${winnerName}(이)가 승리했습니다. ${game.usedWords.length * 8}의 넙죽코인을 획득했습니다.`,
    });

    const timeout = wordChainTimeouts.get(roomIdStr);
    if (timeout) {
      clearTimeout(timeout);
    }
    wordChainTimeouts.delete(roomIdStr);
    return;
  } else if (game.players.length <= 0) {
    // Definitely something is wrong
    // So just shut the game down.
    game.finished = true;
    await game.save();

    const timeout = wordChainTimeouts.get(roomIdStr);
    if (timeout) {
      clearTimeout(timeout);
    }
    wordChainTimeouts.delete(roomIdStr);

    await emitChatEvent(io, {
      roomId,
      type: "wordChain",
      content: `참가자가 모두 탈락하여 게임이 종료되었습니다.`,
    });
    return;
  } else {
    const timestamp = Date.now();
    if (!droppedPlayer) {
      return;
    }
    if (
      eventPeriod &&
      timestamp < eventPeriod.endAt &&
      timestamp >= eventPeriod.startAt
    ) {
      minigameReward(
        Math.min(400, game.usedWords.length * 4),
        droppedPlayer._id.toString(),
        "wordChain"
      );
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `${droppedPlayer.nickname}님이 ${game.usedWords.length * 4}의 넙죽코인을 수령하셨습니다.`,
      });
    }
    game.currentPlayerIndex = game.currentPlayerIndex % game.players.length;
    game.updatedAt = new Date();
    await game.save();

    const nextPlayerId = game.players[game.currentPlayerIndex];
    const nextPlayer = await userModel.findById(nextPlayerId);
    const nextPlayerName = nextPlayer ? nextPlayer.nickname : "알 수 없음";
    await emitChatEvent(io, {
      roomId,
      type: "wordChain",
      content: `다음 차례는 ${nextPlayerName}입니다.`,
    });
    const timeoutId = setTimeout(JudgeTimeout, TIMEOUT_MS, io, roomId);
    wordChainTimeouts.set(roomId.toString(), timeoutId);
    return;
  }
};

export const wordChain = async (
  io: Server,
  roomId: Types.ObjectId,
  word: string,
  player: Types.ObjectId
) => {
  const room = await roomModel.findById(roomId);
  if (!room) {
    return { success: false, error: "Room not found" };
  }

  const playerIdStr = player.toString();
  const roomIdStr = roomId.toString();

  const game = await wordChainModel.findOne({
    roomId: roomId,
    finished: false,
  });
  if (!game) {
    const partId = room.part.map((participant) => participant.user);
    const partIdStr = partId.map((id) => id.toString());
    if (!partIdStr.includes(playerIdStr)) {
      return {
        success: false,
        error: `Player ${player} not in room ${partId}`,
      };
    }
    const currentPlayerIndex =
      (partIdStr.indexOf(playerIdStr) + 1) % partIdStr.length; // since part.includes(player) is true, this will never be -1

    logger.info(
      `participant list: ${partIdStr}, starting player index: ${currentPlayerIndex}`
    );

    const wordExists = await dictionaryModel.findOne({ word });
    logger.info(
      `Checking if word "${word}" exists in dictionary: ${!!wordExists}`
    );
    if (!wordExists) {
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `"${word}"(은)는 사전에 없습니다. 다른 단어를 입력해주세요.`,
      });
      return;
    }
    await wordChainModel.create({
      roomId: roomId,
      currentWord: word,
      usedWords: [word],
      players: partId,
      currentPlayerIndex,
      updatedAt: new Date(),
    });
    logger.info(
      `WordChain game started in room ${roomId} by player ${player} with word "${word}"`
    );
    await emitChatEvent(io, {
      roomId,
      type: "wordChain",
      content: `끝말잇기가 시작되었습니다! 첫 단어는 "${word}"입니다. 다음 차례는 ${
        (await userModel.findById(partId[currentPlayerIndex]))?.nickname
      }입니다.`,
    });

    const timeoutId = setTimeout(JudgeTimeout, TIMEOUT_MS, io, roomId);
    wordChainTimeouts.set(roomIdStr, timeoutId);
    return { success: true };
  } else {
    if (
      game.players[game.currentPlayerIndex].toString() !== player.toString()
    ) {
      const currentPlayer = await userModel.findById(
        game.players[game.currentPlayerIndex]
      );
      const currentPlayerName = currentPlayer
        ? currentPlayer.nickname
        : "알 수 없음";
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `현재 차례는 ${currentPlayerName}님 입니다.`,
      });
      return;
    }

    if (game.usedWords.includes(word)) {
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `"${word}"(은)는 이미 사용되었습니다. 다른 단어를 입력해주세요.`,
      });
      return;
    }

    const lastChar = game.currentWord.slice(-1);
    if (word[0] !== lastChar) {
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `"${word}"(은)는 마지막 글자인 "${lastChar}"로 시작하지 않습니다. 다른 단어를 입력해주세요.`,
      });
      return;
    }

    const wordExists = await dictionaryModel.findOne({ word });
    logger.info(
      `Checking if word "${word}" exists in dictionary: ${!!wordExists}`
    );

    if (!wordExists) {
      await emitChatEvent(io, {
        roomId,
        type: "wordChain",
        content: `"${word}"(은)는 사전에 없는 단어입니다. 다른 단어를 입력해주세요.`,
      });
      return;
    }
    game.currentWord = word;
    game.usedWords.push(word);
    game.currentPlayerIndex =
      (game.currentPlayerIndex + 1) % game.players.length;
    game.updatedAt = new Date();

    const nextPlayer = await userModel.findById(
      game.players[game.currentPlayerIndex]
    );
    if (!nextPlayer) {
      return { success: false, error: "Next player not found" };
    }
    await game.save(); // if there is no nextPlayer, not going to save the gameState. Think such case won't happen. Just in case.
    await emitChatEvent(io, {
      roomId,
      type: "wordChain",
      content: `"${word}"(으)로 단어를 입력했습니다. 다음 차례는 ${
        nextPlayer.nickname
      }입니다. ${word.slice(-1)}로 시작하는 단어를 입력해주세요.`,
    });

    const prevTimeout = wordChainTimeouts.get(roomIdStr);
    if (prevTimeout) clearTimeout(prevTimeout);
    wordChainTimeouts.delete(roomIdStr);

    const timeoutId = setTimeout(JudgeTimeout, TIMEOUT_MS, io, roomId);
    wordChainTimeouts.set(roomIdStr, timeoutId);

    const nextPlayerName = nextPlayer.nickname;
    return {
      success: true,
      nextPlayerName,
    };
  }
};
