const util = require("util");
const exec = util.promisify(require("child_process").exec);
const security = require("./security");

const main = async () => {
  const { stdout, stderr } = await exec(`mongodump ${security.mongo}`);
  process.exit(0);
};

try {
  main();
} catch (_) {
  console.log(
    "DB 연결 주소가 올바르지 않습니다. DB 연결 주소를 다시 한 번 확인해주세요."
  );
}
