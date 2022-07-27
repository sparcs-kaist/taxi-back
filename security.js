require("dotenv").config();

module.exports = {
  mongo: process.env.DB_PATH,
  users: process.env.USERS.split(", "),
  locations: process.env.LOCATIONS.split(", "),
  numberOfRooms: parseInt(process.env.NUM_OF_ROOMS),
  numberOfChats: parseInt(process.env.NUM_OF_CHATS),
  maximumIntervalBtwChats: parseFloat(
    process.env.MAXIMUM_INTERVAL_BETWEEN_CHATS
  ),
  occurenceOfJoin: parseFloat(process.env.OCCURENCE_OF_JOIN),
  occurenceOfAbort: parseFloat(process.env.OCCURENCE_OF_ABORT),
};
