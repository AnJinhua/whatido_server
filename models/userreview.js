const mongoose = require('mongoose')

const { Schema } = mongoose

const UserReviewSchema = new Schema(
  {
    expertSlug: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    review: { type: String, default: '' },
    title: { type: String, default: 'user rating' },
    userSlug: { type: String, required:true },
  },
  {
    timestamps: true, // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
  }
)

module.exports = mongoose.model('UserReview', UserReviewSchema)
