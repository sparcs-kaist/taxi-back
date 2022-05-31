const { Server } = require("socket.io");
const sharedsession = require("express-socket.io-session");
const cookieParser = require("cookie-parser");
const security = require("../../security");
const { ioListeners } = require("../route/chats.socket");

// server: express server
// session: session middleware
module.exports = (server, session) => {
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

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});

    // 채팅 이벤트 리스너들을 함수로 분리
    ioListeners(io, socket);
  });

  return io;
};
