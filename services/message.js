const Message = require("../models/message");

const createMessageService = async (message) => {
  const newMessage = new Message(message);

  try {
    const _message = await newMessage.save();
    return {
      data: _message,
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

const updateMessageService = async (req) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    return {
      data: updatedMessage,
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
const deleteMessageService = async (req) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    return {
      data: deletedMessage,
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
  createMessageService,
  updateMessageService,
  deleteMessageService,
};
