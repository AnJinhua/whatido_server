const Conversation = require("../models/conversation");

const createConversationService = async (req) => {
  const newConversation = new Conversation({
    members: [req.body.senderSlug, req.body.recieverSlug],
    lastReciever: req.body.recieverSlug,
  });

  try {
    const conversation = await newConversation.save();
    return {
      data: conversation,
      error: false,
      message: "success",
      statusCode: 200,
    };
  } catch (error) {
    return {
      data: {},
      error: true,
      message: "Sorry an error occurred",
      statusCode: 500,
    };
  }
};

const updateConversationService = async (req) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    return {
      data: conversation,
      error: false,
      message: "success",
      statusCode: 200,
    };
  } catch (error) {
    return {
      data: {},
      error: true,
      message: "Sorry an error occurred",
      statusCode: 500,
    };
  }
};

module.exports = {
  createConversationService,
  updateConversationService,
};
