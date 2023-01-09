const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    community: {
      type: String,
      default: null,
    },
    tags: {
      type: Array,
      default: [],
    },
    file: {
      type: Array,
      default: [],
    },
    thumbnail: {
      type: Array,
      default: [],
    },
    inspired: {
      type: Array,
      default: [],
    },
    text: {
      type: String,
      default: null,
    },
    userSlug: {
      type: String,
      required: true,
    },
    youtubeLink: {
      type: String,
      default: null,
    },
    shares: {
      type: Array,
      default: [],
    },
    playcounts:{
      type: Number,
      default:0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
