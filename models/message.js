const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      default: "",
    },
    sender: {
      type: String,
      required: true,
    },
    reciever: {
      type: String,
      required: true,
    },
    imgFileArray: {
      type: Array,
      default: null,
    },
    audioFile: {
      type: {
        audioLength: String,
        audioUrl: {},
      },
      default: null,
    },
    zoomLink: {
      type: String,
      default: null,
    },
    text: {
      type: String,
      default: "",
    },
    withAvatar: {
      type: Boolean,
      default: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    quote: {
      type: {
        text: {
          type: String,
          default: null,
        },
        imageUrl: {
          type: String,
          default: null,
        },
        storyId: {
          type: String,
          default: null,
        },
        senderName: {
          firstName: String,
          lastName: String,
        },
        time: Date,
      },
      default: null,
    },
    share: {
      type: String,
      default: null,
    },
    senderName: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },
    deleted: {
      type: Array,
      default: [],
    },
    blocked: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
