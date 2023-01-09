const mongoose = require("mongoose");

const FollowersSchema = new mongoose.Schema(
  {
    userSlug: {
      type: String,
      default: null,
    },
    following: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["community", "expert"],
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Followers", FollowersSchema);
