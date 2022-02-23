require("dotenv").config();

const env = {
  mongo: process.env.DB_PATH,
  numberOfRooms: (process.env.NUM_OF_ROOMS *= 1),
  numberOfChats: (process.env.NUM_OF_CHATS *= 1),
};

module.exports = env;
