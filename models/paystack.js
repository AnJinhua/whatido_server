const mongoose = require("mongoose");

const PaystackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slug: {
      type: String,
      required: true,
    },
    paystack_acct_id: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "NG",
    },
    currency: {
      type: String,
      required: true,
      default: "NGN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paystack", PaystackSchema);
