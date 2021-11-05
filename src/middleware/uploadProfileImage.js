// 프로필 사진 업로드를 위한 Multer middleware
const multer = require("multer");
const crypto = require("crypto");

const uploadProfileImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "public/profile-images/user-upload");
    },
    filename: (req, file, callback) => {
      const hash = crypto.createHash("sha256");
      const randomString = crypto.randomBytes(20).toString("hex");
      callback(null, randomString + Date.now());
    },
  }),
  limits: {
    fieldNameSize: 100, //Maximum field name size is 100 bytes.
    fileSize: 2 * 1024 * 1024, //Maximum file size is 2MB.
    files: 1, //The number of file(s) should be 1
  },
});

module.exports = uploadProfileImage;
