const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
      required: true,
    },
    archived: {
      type: Array,
      default: [],
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

module.exports = mongoose.model("Conversation", ConversationSchema);
