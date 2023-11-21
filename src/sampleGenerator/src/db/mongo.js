const mongoose = require("mongoose");
const security = require("../../security");

const database = mongoose.connection;

database.on("error", console.error.bind(console, "mongoose connection error."));

database.on("connected", async () => {
  console.log("데이터베이스와 연결되었습니다.");
});

database.on("error", function (err) {
  console.error("데이터베이스 연결 에러 발생: " + err);
  mongoose.disconnect();
});

database.on("disconnected", function () {
  console.log("데이터베이스와 연결이 끊어졌습니다!");
  mongoose.connect(security.mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

mongoose.connect(security.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;
