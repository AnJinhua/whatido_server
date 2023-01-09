require('dotenv').config()
const Message = require("../models/message");
const config = process.env;
const { MEDIA_CDN_URL } = require("../config/s3");

const {
  createMessageService,
  updateMessageService,
  deleteMessageService,
} = require("../services/message");





//create message
exports.addNewMessage = async (req, res) => {
  const result = await createMessageService(req.body);
  res.status(result.statusCode).json(result.data);
};

//update message
exports.updateMessage = async (req, res) => {
  const result = await updateMessageService(req);
  res.status(result.statusCode).json(result.data);
};

//delete a message
exports.deleteMessage = async (req, res) => {
  const result = await deleteMessageService(req);
  res.status(result.statusCode).json(result.data);
};


exports.uploadS3 = async (req, res) => {
  try {
    const uploadedFile = req.files.file[0];

    if (!uploadedFile) {
      res.status(401).json({
        status: false,
        message: "File not uploaded",
      });
    } else {
      const resData = {
        location: uploadedFile.location,
        key: uploadedFile.key,
        cdnUrl: MEDIA_CDN_URL + "messenger/" + uploadedFile.key,
      };
      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.uploadMultiS3 = async (req, res) => {
  try {
    const uploadedFile = req.files.file;

    if (!uploadedFile[0]) {
      res.status(401).json({
        status: false,
        message: "File not uploaded",
      });
    } else {
      const resData = uploadedFile.map((file) => {
        return {
          location: file.location,
          key: file.key,
          cdnUrl: MEDIA_CDN_URL + "messenger/" + file.key,
        };
      });

      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};


//get all messeges
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get all messages ordered from latest to oldest and add pagination that returns 20 messages per page using req.query.page to get the next 20 messages
exports.getPaginatedMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
    })
      .sort({ createdAt: -1 })
      .skip(req.query.page * 20)
      .limit(20);
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get last message in a conversation
exports.getLastMessage = async (req, res) => {
  try {
    //get only the last recent message
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};
//get message count
exports.getMessageCount = async (req, res) => {
  try {
    //get only the count of messages;
    const messages = await Message.count({
      conversationId: req.params.conversationId,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get last five messages in a conversation
exports.getLastFiveMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
    })
      .sort({ createdAt: -1 })
      .limit(5);
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get unread message of userSlug
exports.getUnreadMessagesOfUser = async (req, res) => {
  try {
    const messages = await Message.find({
      reciever: req.params.userSlug,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
      read: false,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get unread messages
exports.getUnreadMessagesofConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      reciever: req.params.userSlug,
      deleted: { $ne: [req.params.userSlug] },
      blocked: { $ne: [req.params.userSlug] },
      read: false,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};


