const { getLoginInfo } = require("../auth/login");
const { roomModel, userModel, chatModel } = require("../db/mongo");

module.exports = (io, socket) => {
    const session = socket.handshake.session;

    socket.on("chats-join", async (roomId) => {
        try {
            const myUserId = getLoginInfo({ sesison: session }).id || '';
            const myUser = await userModel.findOne({ id: myUserId }, "_id");
            if(!myUser) return io.to(socket.id).emit("chats-join", { err: "user not exist" });

            roomModel.findOne({ "_id": roomId }, "part", (err, room) => {
                if(err) return io.to(socket.id).emit("chats-join", { err: "mongo error" });
                if(!room) return io.to(socket.id).emit("chats-join", { err: "room not exist" });
                
                // if user don't participate in the room
                if(room.part.indexOf(myUser._id) < 0){
                    return io.to(socket.id).emit("chats-join", { err: "user not join" });
                }

                // find chats
                chatModel.find({ roomId: roomId }, (err, chats) => {
                    if(err) return res.status(404).send(err);  
                    io.to(socket.id).emit("chats-join", { chats: chats });
                }).sort({ time: 1 })
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

    socket.on("chats-send", async ({ roomId, content }) => {
        try {
            const myUserId = getLoginInfo({ sesison: session }).id || '';
            const myUser = await userModel.findOne({ id: myUserId }, "_id nickname");
            if(!myUser) return io.to(socket.id).emit("chats-send", { err: "user not exist" });

            roomModel.findOne({ "_id": roomId }, "part", (err, room) => {
                if(err) return io.to(socket.id).emit("chats-send", { err: "mongo error" });
                if(!room) return io.to(socket.id).emit("chats-send", { err: "room not exist" });
                
                // if user don't participate in the room
                if(room.part.indexOf(myUser._id) < 0){
                    return io.to(socket.id).emit("chats-send", { err: "user not join" });
                }

                // push chat to db
                const chat = new chatModel({
                    roomId: roomId,
                    authorId: myUser._id, authorName: myUser.nickname,
                    text: content, time: Date.now()
                });
                chat.save(err => {
                    if(err) io.to(socket.id).emit("chats-send", { err: "mongo error" });
                    else io.to(socket.id).emit("chats-send", { done: true });
                })
            })
        } catch(e) {
            io.to(socket.id).emit("chats-send", { err: true });
        }
    });
}