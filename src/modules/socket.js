//FIXME: 페이지에 들어오고 나갈 때마다 입장/퇴장 이벤트를 발생시키므로 수정해야 합니다.

const { Server } = require("socket.io");
const security = require("../../security");
const { userModel, chatRoomModel } = require("../db/mongo");
const sharedsession = require("express-socket.io-session");
const cookieParser = require("cookie-parser");

// server: express server
// session: session middleware
const startSocketServer = (server, session) => {
  const io = new Server(server, {
    cors: {
      origin: [security.frontUrl],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // socket.io와 express 사이에서 session을 공유합니다.
  io.use(
    sharedsession(session, cookieParser(), {
      autoSave: true,
    })
  );

  io.on("connection", async (socket) => {
    console.log("a user connected!");

    // if session id not given, disconnect
    const loginInfo = socket.handshake.session.loginInfo;
    if (!loginInfo || !loginInfo.id) {
      socket.disconnect();
      return;
    }

    const user = await userModel.findOne({ id: loginInfo.id }).lean();

    // roomId 를 인자로 받아, 해당 방에 참가시킨다.
    // ~님이 채팅방에 참여했습니다. 메시지 출력/기록
    socket.on("join", async (roomId) => {
      try {
        let result = await chatRoomModel.findOne({ _id: roomId });
        if (!result) {
          result = await chatRoomModel.create({
            _id: roomId,
            chats: [],
            isSecret: false,
          });
        }
        socket.username = user.nickname;
        socket.join(roomId);
        const newUserChat = {
          author: socket.username,
          text: "님이 채팅방에 참여했습니다.",
          time: new Date(),
        };
        await result.updateOne({ $push: { chats: newUserChat } });
        // await chatRoomModel.updateOne({ "_id": socket.activeRoom }, {
        //   $push: {
        //     "chats": newUserChat
        //   }
        // })
        // FIXME: 보내는 정보 따로 없다. 아예 필요 없을수도?
        socket.emit("joined");
        socket.activeRoom = roomId;
        io.to(socket.activeRoom).emit("chatEvent", newUserChat);
      } catch (e) {
        console.error(e);
      }
    });

    socket.on("chatEvent", (chat) => {
      // chat: { text: string, time: Date }
      console.log("chatEvent");
      chat.author = socket.username;
      chatRoomModel
        .updateOne(
          { _id: socket.activeRoom },
          {
            $push: {
              chats: chat,
            },
          }
        )
        .exec();
      io.to(socket.activeRoom).emit("chatEvent", chat);
    });

    socket.on("disconnect", async (reason) => {
      console.log("exit");
      try {
        const chat = {
          author: socket.username,
          text: "님이 퇴장했습니다.",
          time: new Date(),
        };
        const res = await chatRoomModel.updateOne(
          { _id: socket.activeRoom },
          {
            $push: {
              chats: chat,
            },
          }
        );
        console.log(res);
        io.to(socket.activeRoom).emit("chatEvent", chat);
      } catch (e) {
        console.error(e);
      }
    });
  });

  return io;
};

module.exports = startSocketServer;
