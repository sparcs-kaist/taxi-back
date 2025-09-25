import { chatModel, userModel, roomModel } from "@/modules/stores/mongo";
import {
  chatPopulateOption,
  type ChatPopulatePath,
} from "@/modules/populates/chats";
import * as aws from "@/modules/stores/aws";
import {
  transformChatsForRoom,
  emitChatEvent,
  emitUpdateEvent,
  getSessionRoom,
} from "@/modules/socket";
import logger from "@/modules/logger";

import type { RequestHandler } from "express";
import type {
  LoadRecentChatBody,
  LoadAfterChatBody,
  LoadBeforeChatBody,
  SendChatBody,
  ReadChatBody,
  UploadChatImgGetPUrlBody,
  UploadChatImgDoneBody,
} from "@/routes/docs/schemas/chatsSchema";

const chatCount = 60;

export const loadRecentChatHandler: RequestHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId }: LoadRecentChatBody = req.body;
    if (!userOid) {
      return res.status(500).send("Chat/ : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/ : socket did not connected");
    }

    const isPart = await isUserInRoom(userOid, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/ : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, isValid: true })
      .sort({ time: -1 })
      .limit(chatCount)
      .lean()
      .populate<ChatPopulatePath>(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.in(getSessionRoom(req)).emit("chat_init", {
        chats: await transformChatsForRoom(chats),
      });
      return res.json({ result: true });
    } else {
      return res.status(500).send("Chat/ : internal server error");
    }
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Chat/ : internal server error");
  }
};

export const loadBeforeChatHandler: RequestHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, lastMsgDate }: LoadBeforeChatBody = req.body;
    if (!userOid) {
      return res.status(500).send("Chat/load/before : internal server error");
    }
    if (!io) {
      return res
        .status(403)
        .send("Chat/load/before : socket did not connected");
    }

    const isPart = await isUserInRoom(userOid, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/load/before : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, time: { $lt: lastMsgDate }, isValid: true })
      .sort({ time: -1 })
      .limit(chatCount)
      .lean()
      .populate<ChatPopulatePath>(chatPopulateOption);

    if (chats) {
      chats.reverse();
      io.in(getSessionRoom(req)).emit("chat_push_front", {
        chats: await transformChatsForRoom(chats),
      });
      return res.json({ result: true });
    } else {
      return res.status(500).send("Chat/load/before : internal server error");
    }
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Chat/load/before : internal server error");
  }
};

export const loadAfterChatHandler: RequestHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, lastMsgDate }: LoadAfterChatBody = req.body;
    if (!userOid) {
      return res.status(500).send("Chat/load/after : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/load/after : socket did not connected");
    }

    const isPart = await isUserInRoom(userOid, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/load/after : user did not participated in the room");
    }

    const chats = await chatModel
      .find({ roomId, time: { $gt: lastMsgDate }, isValid: true })
      .sort({ time: 1 })
      .limit(chatCount)
      .lean()
      .populate<ChatPopulatePath>(chatPopulateOption);

    if (chats) {
      io.in(getSessionRoom(req)).emit("chat_push_back", {
        chats: await transformChatsForRoom(chats),
      });
      return res.json({ result: true });
    } else {
      return res.status(500).send("Chat/load/after : internal server error");
    }
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Chat/load/after : internal server error");
  }
};

export const sendChatHandler: RequestHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, type, content }: SendChatBody = req.body;
    const user = await userModel.findOne({ _id: userOid, withdraw: false });

    if (!userOid || !user) {
      return res.status(500).send("Chat/send : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/send : socket did not connected");
    }

    const isPart = await isUserInRoom(userOid, roomId);
    if (!isPart) {
      return res
        .status(403)
        .send("Chat/send : user did not participated in the room");
    }

    if (
      await emitChatEvent(io, {
        roomId,
        type,
        content,
        authorId: user._id,
      })
    )
      return res.json({ result: true });
    else return res.status(500).send("Chat/send : internal server error");
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Chat/send : internal server error");
  }
};

export const readChatHandler: RequestHandler = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId }: ReadChatBody = req.body;
    const user = await userModel.findOne({ _id: userOid, withdraw: false });

    if (!userOid || !user) {
      return res.status(500).send("Chat/read : internal server error");
    }
    if (!io) {
      return res.status(403).send("Chat/read : socket did not connected");
    }

    const roomObject = await roomModel
      .findOneAndUpdate(
        {
          _id: roomId,
          part: {
            $elemMatch: {
              user: user._id,
            },
          },
        },
        {
          $set: { "part.$[updater].readAt": req.timestamp },
        },
        {
          new: true,
          arrayFilters: [{ "updater.user": { $eq: user._id } }],
        }
      )
      .lean();

    if (!roomObject) {
      return res.status(404).send("Chat/read : cannot find room info");
    }

    if (await emitUpdateEvent(io, roomId)) return res.json({ result: true });
    else
      return res.status(500).send("Chat/read : failed to emit socket events");
  } catch (e) {
    logger.error(e);
    return res.status(500).send("Chat/read : internal server error");
  }
};

export const uploadChatImgGetPUrlHandler: RequestHandler = async (req, res) => {
  try {
    const { type, roomId }: UploadChatImgGetPUrlBody = req.body;
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    if (!roomId) {
      return res
        .status(403)
        .send("Chat/uploadChatImg/getPUrl : did not joined the chatting");
    }
    if (!user) {
      return res
        .status(500)
        .send("Chat/uploadChatImg/getPUrl : internal server error");
    }
    const chatDocument = new chatModel({
      roomId: roomId,
      type: "s3img",
      authorId: user._id,
      time: Date.now(),
      isValid: false,
    });
    const chat = await chatDocument.save();
    const key = `chat-img/${chat._id}`;
    const data = await aws.getUploadPUrlPost(key, type);
    return res.json({ url: data, id: chat._id });
  } catch (e) {
    logger.error(e);
    return res
      .status(500)
      .send("Chat/uploadChatImg/getPUrl : internal server error");
  }
};

export const uploadChatImgDoneHandler: RequestHandler = async (req, res) => {
  try {
    const { id }: UploadChatImgDoneBody = req.body;
    const user = await userModel.findOne(
      { _id: req.userOid, withdraw: false },
      "_id nickname profileImageUrl"
    );
    const chat = await chatModel.findById(id).lean();
    if (!user) {
      return res
        .status(500)
        .send("Chat/uploadChatImg/done : internal server error");
    }
    if (!chat) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    if (
      chat.type !== "s3img" ||
      chat.isValid !== false ||
      chat.authorId!.toString() !== user._id.toString()
    ) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }

    const key = `chat-img/${chat._id}`;
    if (!(await aws.foundObject(key))) {
      return res
        .status(400)
        .send("Chat/uploadChatImg/done : no such image uploaded");
    }

    chat.content = chat._id.toString();
    await emitChatEvent(req.app.get("io"), chat);
    return res.json({ result: true });
  } catch (e) {
    logger.error(e);
    return res
      .status(500)
      .send("Chat/uploadChatImg/done : internal server error");
  }
};

/**
 * 주어진 유저가 주어진 방에 참여하는 중인지 확인합니다.
 * @summary 채팅 load/send 관련 api에서 검증을 위하여 함수로 분리하였습니다.
 * @param userOid - 확인하고픈 user의 objectId 입니다.
 * @param roomId - 참여하는지 확인하고픈 방의 objectId 입니다.
 * @return userId가 방에 포함되어 있다면 true, 그 외의 경우 false를 반환합니다.
 */
const isUserInRoom = async (userOid: string, roomId: string) => {
  const result = await roomModel.findById(roomId);
  return (
    result?.part
      .map((participant) => participant.user)
      .some((user) => user.equals(userOid)) ?? false
  );
};
