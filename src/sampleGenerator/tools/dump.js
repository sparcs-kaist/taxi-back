const util = require("util");
const path = require("path");
const exec = util.promisify(require("child_process").exec);
const { mongo: mongoUrl } = require("../loadenv");

const main = async () => {
  const { stdout, stderr } = await exec(
    `mongodump ${mongoUrl} --out ${path.resolve("dump")}`
  );
  console.log("dump 디렉토리에 데이터베이스 데이터를 덤프했습니다.");
  process.exit(0);
};

try {
  main();
} catch {
  console.log(
    "DB 연결 주소가 올바르지 않습니다. DB 연결 주소를 다시 한 번 확인해주세요."
  );
}
