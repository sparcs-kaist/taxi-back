const { Server } = require("socket.io");
const { chatRoomModel } = require("../db/mongo");
const jwt = require('jsonwebtoken');

// server: express server
// session: session middleware
const startSocketServer = (server) => {
  // FIXME: front server hard coded
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log("a user connected!");

    // if session id not given, disconnect
    const token = socket.handshake.auth.token;
    console.log("token: " + token)
    if (!token || token.length === 0) {
      socket.disconnect();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // roomId 를 인자로 받아, 해당 방에 참가시킨다.
    // ~님이 채팅방에 참여했습니다. 메시지 출력/기록
    socket.on('join', async (roomId) => {
      try {
        let result = await chatRoomModel.findOne({ "_id": roomId })
        if (!result) {
          result = await chatRoomModel.create({ "_id": roomId, "chats": [], "isSecret": false });
        }
        socket.username = decoded.name;
        socket.join(roomId);
        const newUserChat = { author: socket.username, text: "님이 채팅방에 참여했습니다.", time: new Date() };
        await result.updateOne({ $push: { "chats": newUserChat } });
        // await chatRoomModel.updateOne({ "_id": socket.activeRoom }, {
        //   $push: {
        //     "chats": newUserChat
        //   }
        // })
        // FIXME: 보내는 정보 따로 없다. 아예 필요 없을수도?
        socket.emit("joined");
        socket.activeRoom = roomId;
        io.to(socket.activeRoom).emit('chatEvent', newUserChat);
      } catch (e) {
        console.error(e);
      }
    })

    socket.on('chatEvent', (chat) => {
      // chat: { text: string, time: Date }
      console.log('chatEvent');
      chat.author = socket.username;
      chatRoomModel.updateOne({ "_id": socket.activeRoom }, {
        $push: {
          "chats": chat
        }
      }).exec();
      io.to(socket.activeRoom).emit('chatEvent', chat)
    })

    socket.on('disconnect', async (reason) => {
      console.log('exit');
      try {
        const chat = {
          author: socket.username, text: "님이 퇴장했습니다.", time: new Date()
        }
        const res = await chatRoomModel.updateOne({ "_id": socket.activeRoom }, {
          $push: {
            "chats": chat
          }
        })
        console.log(res);
        io.to(socket.activeRoom).emit('chatEvent', chat);
      } catch (e) {
        console.error(e);
      }
    })
  });

  return io;
}


module.exports = startSocketServer;