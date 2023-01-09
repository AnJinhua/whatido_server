const mongoose = require("mongoose");

const userStatusSchema = new mongoose.Schema(
    {
        userSlug: String,
        socketId: String,
        status: String,
    },
    {
        timestamps: true, // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
      })
module.exports = mongoose.model('userStatus', userStatusSchema)
