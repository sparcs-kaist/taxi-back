require("dotenv").config();
const fs = require("fs");
const path = require("path");
sampleData = JSON.parse(fs.readFileSync(path.resolve(".", "sampleData.json")));

module.exports = {
  mongo: process.env.DB_PATH,
  users: sampleData.users,
  locations: sampleData.locations,
  numberOfRooms: parseInt(process.env.NUM_OF_ROOMS),
  numberOfChats: parseInt(process.env.NUM_OF_CHATS),
  maximumIntervalBtwChats: parseFloat(
    process.env.MAXIMUM_INTERVAL_BETWEEN_CHATS
  ),
  occurenceOfJoin: parseFloat(process.env.OCCURENCE_OF_JOIN),
  occurenceOfAbort: parseFloat(process.env.OCCURENCE_OF_ABORT),
};
