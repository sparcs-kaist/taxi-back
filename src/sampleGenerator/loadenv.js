// Root directory에 있는 .env.test 파일을 읽어옴
require("dotenv").config({ path: "./.env.test" });

module.exports = {
  mongo: process.env.DB_PATH, // required
  numberOfRooms: parseInt(process.env.SAMPLE_NUM_OF_ROOMS ?? 2), // optional
  numberOfChats: parseInt(process.env.SAMPLE_NUM_OF_CHATS ?? 200), // optional
  maximumIntervalBtwChats: parseFloat(
    process.env.SAMPLE_MAXIMUM_INTERVAL_BETWEEN_CHATS ?? 20
  ), // optional
  occurenceOfJoin: parseFloat(process.env.SAMPLE_OCCURENCE_OF_JOIN ?? 0.1), // optional
  occurenceOfAbort: parseFloat(process.env.SAMPLE_OCCURENCE_OF_ABORT ?? 0.1), // optional
};
