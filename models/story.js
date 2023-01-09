const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    storyId: {
      type: String,
      required: true,
    },
    storyType: {
      type: String,
      enum: ["image", "text", "imageText", "video", "videoText"],
      required: true,
    },
    community: {
      type: String,
      default: null,
    },
    file: {
      type: Object,
      default: null,
    },
    thumbnail: {
      type: Object,
      default: null,
    },
    text: {
      type: String,
      default: null,
    },
    userSlug: {
      type: String,
      required: true,
    },

    views: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", StorySchema);
