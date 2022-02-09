const { getLoginInfo } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");

module.exports = (io, socket) => {
    const session = socket.handshake.session;

    socket.on("chats-join", (roomId) => {
        try {
            const myUserId = getLoginInfo({ sesison: session }).id || '';
            roomModel.findOne({ "_id": roomId }, "part", (err, room) => {
                if(err) return io.to(socket.id).emit("chats-join", { err: "mongo error" });
                if(!room) return io.to(socket.id).emit("chats-join", { err: "room not exist" });
            })
        } catch(e) {
            io.to(socket.id).emit("chats-join", { err: true });
        }
    });

    socket.on("chats-disconnect", (roomId) => {
        try {
            const myUserId = getLoginInfo({ sesison: session }).id || '';

        } catch(e) {
            // console.log(e);
        }
    });

    socket.on("chats-send", (roomId) => {
        try {
            const myUserId = getLoginInfo({ sesison: session }).id || '';

        } catch(e) {
            // console.log(e);
        }
    });
}