require("dotenv").config();

const env = {
  mongo: process.env.DB_PATH,
  taxiBackDir: process.env.TAXI_BACK_DIR,
  numberOfRooms: (process.env.NUM_OF_ROOMS *= 1),
  numberOfChats: (process.env.NUM_OF_CHATS *= 1),
};

console.log(env);

module.exports = env;
