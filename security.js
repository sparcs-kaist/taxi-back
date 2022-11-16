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
};
