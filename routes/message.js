const multer = require("multer");
const express = require("express");
const MessageController = require('../controllers/message')
const router = express.Router()
const messageRoutes = express.Router()
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });
router.use("/message",messageRoutes);

const {
  messengerUploader,
} = require("../controllers/uploaderController");
// storage needed for saving images from forms
const audioStorage = multer.diskStorage({
  filename: (req, file, cb) => {
    const fileExt = file.originalname.split(".").pop();
    const filename = `${new Date().getTime()}.${fileExt}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/pipeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "audio/mp3" ||
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/wav" ||
    file.mimetype === "audio/ogg" ||
    file.mimetype === "video/mp4" ||
    file.mimetype === "video/ogg" ||
    file.mimetype === "video/webm"
  ) {
    cb(null, true);
  } else {
    console.log("unsupported file format");
    cb(
      {
        message: "Unsupported File Format",
      },
      false
    );
  }
};


const multerUploader = multer({
  audioStorage,
  limits: {
    fieldNameSize: 200,
    // fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

//create a message
messageRoutes.post("/", MessageController.addNewMessage);
messageRoutes.post(
  "/uploads3",
  requireAuth,
  messengerUploader.fields([{ name: "file", maxCount: 1 }]),
  MessageController.uploadS3
);

messageRoutes.post(
  "/uploadMultiS3",
  requireAuth,
  messengerUploader.fields([{ name: "file", maxCount: 10 }]),
  MessageController.uploadMultiS3
);


//get message by conversatoin id and user slug
messageRoutes.get(
  "/:conversationId/:userSlug",
  MessageController.getAllMessages
);
//get paginated message by conversatoin id and user slug
messageRoutes.get(
  "/page/:conversationId/:userSlug",
  MessageController.getPaginatedMessages
);
//get last message by conversation id
messageRoutes.get(
  "/last/:conversationId/:userSlug",
  MessageController.getLastMessage
);
//get message count
messageRoutes.get(
  "/count/:conversationId/:userSlug",
  MessageController.getMessageCount
);
//get unread messages by user
messageRoutes.get(
  "/unread/user/:userSlug",
  MessageController.getUnreadMessagesOfUser
);
//get unread messages of a conversation
messageRoutes.get(
  "/unread/:conversationId/:userSlug",
  MessageController.getUnreadMessagesofConversation
);
//update message route
messageRoutes.put("/:id", MessageController.updateMessage);
//delete message route
messageRoutes.delete("/:id", MessageController.deleteMessage);

module.exports = router