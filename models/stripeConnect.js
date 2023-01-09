const mongoose = require("mongoose");

const StripeConnectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slug: {
      type: String,
      required: true,
    },
    stripe_acct_id: {
      type: String,
      required: true,
    },
    stripe_acct_balance: {
      type: Number,
      required: true,
      default: 0,
    },
    stripe_payouts_total: {
      type: Number,
      required: true,
      default: 0,
    },
    stripe_payout_date: {
      type: Date,
    },
    country: {
      type: String,
      required: true,
      default: "US",
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    stripe_acct_type: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StripeConnect", StripeConnectSchema);
