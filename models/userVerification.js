const mongoose = require('mongoose')

const userVerificationSchema = mongoose.Schema(
  {
    userId: { type: String },
    uniqueString: { type: String },
    createdAt: { type: Date, default: Date.now, index: { expires: 21600 } },
    expiresAt: { type: Date },
    //After 6 hours it is deleted automatically from the database
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('userVerification', userVerificationSchema)
