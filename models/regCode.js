const mongoose = require('mongoose')

const code = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    createdAt: { type: Date, default: Date.now, index: { expires: 86400 } },
    //After 24 hours it is deleted automatically from the database
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Code', code)
