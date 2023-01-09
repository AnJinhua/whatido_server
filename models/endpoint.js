const mongoose = require("mongoose");

// save push notification subscription to database
const endpointSchema = mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    subscription: { type: Object, required: true },
    userSlug: { type: String, required: true },
  },
  { timestamps: true }
);

const EndpointModel = mongoose.model("endpoint", endpointSchema);

module.exports = EndpointModel;
