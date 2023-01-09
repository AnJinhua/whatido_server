const mongoose = require("mongoose");

const TransactionsSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiverSlug: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["donation", "withdraw", "refund", "wallet"],
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    txHash: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    paymentProvider: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transactions", TransactionsSchema);
