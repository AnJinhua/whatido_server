const multer = require("multer");
var multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../config/s3");

const fileFilter = (req, files, cb) => {
  // reject a file
  if (
    files.mimetype === "image/jpeg" ||
    files.mimetype === "image/pipeg" ||
    files.mimetype === "image/png" ||
    files.mimetype === "image/svg" ||
    files.mimetype === "audio/mp3" ||
    files.mimetype === "audio/mpeg" ||
    files.mimetype === "audio/wav" ||
    files.mimetype === "audio/ogg" ||
    files.mimetype === "video/x-flv" ||
    files.mimetype === "video/ogg" ||
    files.mimetype === "video/mp4" ||
    files.mimetype === "video/webm" ||
    files.mimetype === "application/x-mpegURL" ||
    files.mimetype === "video/MP2T" ||
    files.mimetype === "video/3gpp" ||
    files.mimetype === "video/quicktime" ||
    files.mimetype === "video/x-msvideo" ||
    files.mimetype === "video/x-ms-wmv" ||
    files.mimetype === "application/msword" ||
    files.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    files.mimetype === "application/pdf" ||
    files.mimetype === "application/vnd.oasis.opendocument.text" ||
    files.mimetype === "text/plain"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileFilterAudio = (req, files, cb) => {
  // reject a file
  if (
    files.mimetype === "audio/mp3" ||
    files.mimetype === "audio/mpeg" ||
    files.mimetype === "audio/wav" ||
    files.mimetype === "audio/webm" ||
    files.mimetype === "audio/ogg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileFilterResume = (req, files, cb) => {
  // only accept
  if (
    files.mimetype === "application/msword" ||
    files.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    files.mimetype === "application/pdf" ||
    files.mimetype === "application/vnd.oasis.opendocument.text" ||
    files.mimetype === "text/plain"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const metaData = (req, file, cb) => {
  cb(null, { fieldName: file.fieldname.toString().toLowerCase().replace(/\s/g,'+') });
};

const key = (req, file, cb) => {
  const storyId = uuidv4();

  cb(null, Date.now().toString() + "__" + storyId + "__" + file.originalname.replace(/\s/g,'+'));
};

exports.storyUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/story",
    acl: "public-read",
    metadata: metaData,
    key: key,
  }),
  limits: {
    fileSize: 1024 * 1024 * 250,
  },
  fileFilter: fileFilter,
});

exports.profileUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/profile",
    acl: "public-read",
    metadata: metaData,
    key: key,
  }),
  limits: {
    fileSize: 1024 * 1024 * 250,
  },
  fileFilter: fileFilter,
});

exports.resumeUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/resume",
    acl: "public-read",
    metadata: metaData,
    key: key,
  }),
  limits: {
    fileSize: 1024 * 1024 * 250,
  },
  fileFilter: fileFilterResume,
});

exports.mediaUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/media",
    acl: "public-read",
    metadata: metaData,
    key: key,
  }),
  limits: {
    fileSize: 1024 * 1024 * 250,
  },
  fileFilter: fileFilter,
});

exports.messengerUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/messenger",
    acl: "public-read",
    metadata: metaData,
    key: key,
  }),
  limits: {
    fileSize: 1024 * 1024 * 250,
  },
  fileFilter: fileFilter,
});

exports.audioRoomRecordingUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "donnysliststory/audioRoomRecording",
    acl: "public-read",
    //metadata: metaData,
    key: function (request, file, cb) {
      console.log("audio room uploader", file);
      cb(null, file.originalname);
    },
  }),
  //fileFilter: fileFilterAudio,
});

exports.deleteFile = async (fileKey, folder) => {
  return await s3
    .deleteObject({
      Bucket: `donnysliststory/${folder}`,
      Key: fileKey,
    })
    .promise();
};
