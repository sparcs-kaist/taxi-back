import type { Request, Response, RequestHandler } from "express";
import { chatModel, userModel, roomModel } from "@/modules/stores/mongo";
import { chatPopulateOption } from "@/modules/populates/chats";
import * as aws from "@/modules/stores/aws";
import {
  transformChatsForRoom,
  emitChatEvent,
  emitUpdateEvent,
  ChatArrayObject,
} from "@/modules/socket";
import { Chat, ChatType } from "@/types/mongo";
import logger from "@/modules/logger";

const chatCount = 60;

export const loadRecentChatHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId } = req.body;
    const { id: sessionId } = req.session;
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
      .populate(chatPopulateOption)
      .lean<ChatArrayObject[]>();

    if (chats) {
      chats.reverse();
      io.in(`session-${sessionId}`).emit("chat_init", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/ : internal server error");
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/ : internal server error");
  }
};

export const loadBeforeChatHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, lastMsgDate } = req.body;
    const { id: sessionId } = req.session;
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
      .populate(chatPopulateOption)
      .lean<ChatArrayObject[]>();

    if (chats) {
      chats.reverse();
      io.in(`session-${sessionId}`).emit("chat_push_front", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/load/before : internal server error");
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/load/before : internal server error");
  }
};

export const loadAfterChatHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, lastMsgDate } = req.body;
    const { id: sessionId } = req.session;
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
      .populate(chatPopulateOption)
      .lean<ChatArrayObject[]>();

    if (chats) {
      io.in(`session-${sessionId}`).emit("chat_push_back", {
        chats: await transformChatsForRoom(chats),
      });
      res.json({ result: true });
    } else {
      res.status(500).send("Chat/load/after : internal server error");
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/load/after : internal server error");
  }
};

function isChatType(x: unknown): x is ChatType {
  const chatTypeValues = [
    "text",
    "in",
    "out",
    "s3img",
    "payment",
    "settlement",
    "account",
    "account",
    "arrival",
  ];
  return typeof x === "string" && chatTypeValues.includes(x as string);
}

export const sendChatHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId, type, content } = req.body as {
      roomId: string;
      type: string;
      content: string;
    };
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

    if (!isChatType(type)) {
      return res.status(403).send("Chat/send : Invalid ChatType");
    }
    const convertedType = type;

    if (
      await emitChatEvent(io, {
        roomId,
        type: convertedType,
        content,
        authorId: user._id,
        time: undefined,
      })
    )
      res.json({ result: true });
    else res.status(500).send("Chat/send : internal server error");
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/send : internal server error");
  }
};

export const readChatHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const io = req.app.get("io");
    const { userOid } = req;
    const { roomId } = req.body;
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

    if (await emitUpdateEvent(io, roomId)) res.json({ result: true });
    else res.status(500).send("Chat/read : failed to emit socket events");
  } catch (e) {
    res.status(500).send("Chat/read : internal server error");
  }
};

export const uploadChatImgGetPUrlHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { type, roomId } = req.body;
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
    aws.getUploadPUrlPost(key, type, (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Chat/uploadChatImg/getPUrl : internal server error");
      }
      data.fields["Content-Type"] = type;
      data.fields["key"] = key;
      res.json({
        id: chat._id,
        url: data.url,
        fields: data.fields,
      });
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/uploadChatImg/getPUrl : internal server error");
  }
};

export const uploadChatImgDoneHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await userModel.findOne(
      { _id: req.userOid, withdraw: false },
      "_id nickname profileImageUrl"
    );
    const chat = await chatModel.findById(req.body.id).lean();
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
      chat.type != "s3img" ||
      chat.isValid != false ||
      chat.authorId!.toString() != user._id.toString()
    ) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    const key = `chat-img/${chat._id}`;
    aws.foundObject(key, async (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Chat/uploadChatImg/done : internal server error");
      }

      chat.content = chat._id.toString();
      emitChatEvent(req.app.get("io"), {
        roomId: chat.roomId.toString(),
        type: chat.type!,
        content: chat.content,
        authorId: chat.authorId!,
        time: chat.time,
      });

      res.json({
        result: true,
      });
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Chat/uploadChatImg/done : internal server error");
  }
};

/**
 * 주어진 유저가 주어진 방에 참여하는 중인지 확인합니다.
 * @summary 채팅 load/send 관련 api에서 검증을 위하여 함수로 분리하였습니다.
 * @param {string} userOid - 확인하고픈 user의 objectId 입니다.
 * @param {string} roomId - 참여하는지 확인하고픈 방의 objectId 입니다.
 * @return {Promise<Boolean>} userId가 방에 포함되어 있다면 true, 그 외의 경우 false를 반환합니다.
 */
const isUserInRoom = async (userOid: string, roomId: string) => {
  const result = await roomModel.findById(roomId);
  if (!result) return false;

  const { part } = result;

  if (!part) return false;
  return part
    .map((participant) => participant.user)
    .some((user) => user.equals(userOid));
};
