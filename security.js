require("dotenv").config();
const fs = require("fs");
const path = require("path");
const sampleDataPath = path.resolve(".", "sampleData.json");

const loadSampleData = new Promise((resolve, reject) => {
  fs.readFile(sampleDataPath, (err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(JSON.parse(data));
    }
  });
});

module.exports = {
  loadSampleData,
  mongo: process.env.DB_PATH,
  numberOfRooms: parseInt(process.env.NUM_OF_ROOMS),
  numberOfChats: parseInt(process.env.NUM_OF_CHATS),
  maximumIntervalBtwChats: parseFloat(
    process.env.MAXIMUM_INTERVAL_BETWEEN_CHATS
  ),
  occurenceOfJoin: parseFloat(process.env.OCCURENCE_OF_JOIN),
  occurenceOfAbort: parseFloat(process.env.OCCURENCE_OF_ABORT),
};
