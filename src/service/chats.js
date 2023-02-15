const { chatModel, userModel, roomModel } = require("../db/mongo");
const awsS3 = require("../db/awsS3");

const { getTokensOfUsers, sendMessageByTokens } = require("../modules/fcm");

const uploadChatImgGetPUrlHandler = async (req, res) => {
  try {
    const type = req.body.type;
    const roomId = req.session?.chatRoomId;
    const user = await userModel.findOne({ id: req.userId });
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
    awsS3.getUploadPUrlPost(key, type, (err, data) => {
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
    res.status(500).send("Chat/uploadChatImg/getPUrl : internal server error");
  }
};

const uploadChatImgDoneHandler = async (req, res) => {
  try {
    const user = await userModel.findOne(
      { id: req.userId },
      "_id nickname profileImageUrl"
    );
    const chat = await chatModel.findById(req.body.id);
    if (!user) {
      return res
        .status(500)
        .send("Chat/uploadChatImg/getPUrl : internal server error");
    }
    if (!chat) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    if (
      chat.type != "s3img" ||
      chat.isValid != false ||
      chat.authorId.toString() != user._id.toString()
    ) {
      return res.status(404).json({
        error: "Chat/uploadChatImg/done : no corresponding chat",
      });
    }
    const key = `chat-img/${chat._id}`;
    awsS3.foundObject(key, async (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Chat/uploadChatImg/getPUrl : internal server error");
      }
      const chatAfter = await chatModel
        .findOneAndUpdate(
          { _id: chat._id },
          {
            isValid: true,
            content: chat._id.toString(),
          },
          { new: true }
        )
        .lean();
      if (!chatAfter) {
        return res
          .status(500)
          .send("User/editProfileImg/done : internal server error");
      }

      chatAfter.authorName = user.nickname;
      chatAfter.authorProfileUrl = user.profileImageUrl;

      // 방의 모든 사용자에게 이미지 수신 이벤트를 발생시킵니다.
      req.app
        .get("io")
        .to(`chatRoom-${chatAfter.roomId}`)
        .emit("chats-receive", {
          chat: chatAfter,
        });

      // 이미지 전송 알림을 전송합니다.
      // 해당 방에 참여중인 사용자들에게 알림을 전송합니다.
      const room = await roomModel.findById(chatAfter.roomId, "name part");
      const urlOnClick = `/myroom/${chatAfter.roomId}`;
      const userIdsExceptMe = room.part
        .map((participant) => participant.user)
        .filter((userId) => userId !== user._id);
      const deviceTokens = await getTokensOfUsers(userIdsExceptMe);
      await sendMessageByTokens(
        deviceTokens,
        room.name,
        `${user.nickname}: Image`,
        awsS3.getS3Url(`/profile-img/${user.profileImageUrl}`),
        urlOnClick
      );

      res.json({
        result: true,
      });
    });
  } catch (e) {
    res.status(500).send("Chat/uploadChatImg/done : internal server error");
  }
};

module.exports = {
  uploadChatImgGetPUrlHandler,
  uploadChatImgDoneHandler,
};
