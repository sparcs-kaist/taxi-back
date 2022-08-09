const util = require("util");
const exec = util.promisify(require("child_process").exec);
const security = require("./security");

const main = async () => {
  const dbName = security.mongo.split("/").pop();
  const { stdout, stderr } = await exec(
    `mongorestore ${security.mongo} dump/${dbName}`
  );
  process.exit(0);
};

try {
  main();
} catch (_) {
  console.log(
    "DB를 덤프해올 디렉토리가 존재하지 않습니다. 경로를 다시 한 번 확인해주세요."
  );
}
