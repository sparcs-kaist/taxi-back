// 프로필 사진 업로드를 위한 Multer middleware
const multer = require("multer");
const crypto = require("crypto");
const mime = require("mime-types"); //mime-type을 확장자로 바꾸기 위해 필요한 모듈

// 파일의 mime type이 이미지가 아니면 업로드를 도중에 중단시킵니다.
const fileFilter = (req, file, callback) => {
  const fileType = mime.contentType(file.mimetype);
  if (fileType.split("/")[0] == "image") callback(null, true);
  else callback(null, false);
};

const generateFilename = (req, file, callback) => {
  const randomString = crypto.randomBytes(20).toString("hex") + Date.now();
  const extension = file.mimetype ? mime.extension(file.mimetype) : "jpg";
  callback(null, `${randomString}${Date.now()}.${extension}`);
};

// 프로필 사진 업로드를 위한 미들웨어
const uploadProfileImage = (req, res, next) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, "public/profile-images/user-upload");
      },
      filename: generateFilename,
    }),
    limits: {
      fieldNameSize: 100, //Maximum field name size is 100 bytes.
      fileSize: 2 * 1024 * 1024, //Maximum file size is 2MB.
      files: 1, //The number of file(s) should be 1
    },
    fileFilter: fileFilter,
  }).single("profileImage");

  upload(req, res, (err) => {
    if (err) {
      res.file = null;
    }
    next();
  });
};

module.exports = { uploadProfileImage };
