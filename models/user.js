/* eslint-disable max-len */
// Importing Node packages required for schema
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { LOGIN_SOURCE_FACEBOOK } = require("../constants");
const { LOGIN_SOURCE_TWITTER } = require("../constants");
const { LOGIN_SOURCE_GMAIL } = require("../constants");

var timestamp = function () {
  var timeIndex = 0;
  var shifts = [
    35,
    60,
    60 * 3,
    60 * 60 * 2,
    60 * 60 * 25,
    60 * 60 * 24 * 4,
    60 * 60 * 24 * 10,
  ];

  var now = new Date();
  var shift = shifts[timeIndex++] || 0;
  var date = new Date(now - shift * 1000);

  return date.getTime() / 1000;
};

//= ===============================
// User Schema
//= ===============================
const UserSchema = mongoose.Schema(
  {
    verified: { type: Boolean, required: false },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: { type: String, required: true },
    profile: { firstName: { type: String }, lastName: { type: String } },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    contact: { type: String },
    dob: { type: String },
    currentLocation: { type: String, default: "" },
    locationLat: {
      type: Number,
      default: null,
    },
    locationLng: {
      type: Number,
      default: null,
    },
    userBio: { type: String, default: "" },
    enableAccount: { type: Boolean, default: true }, // true: enable, false: disable
    slug: { type: String, default: "" }, // act as username
    community: { type: {}, default: {} },
    experties: {type: [], default: [] },
    fbLoginAccessToken: { type: String, default: "" },
    jwtLoginAccessToken: { type: String, default: "" },
    loginSource: {
      type: String,
      enum: [LOGIN_SOURCE_FACEBOOK, LOGIN_SOURCE_TWITTER, LOGIN_SOURCE_GMAIL],
    },
    imageUrl: {
      type: {
        cdnUrl: {
          type: String,
          default:
            "https://donnysliststory.sfo3.cdn.digitaloceanspaces.com/profile/profile.png",
        },
        location: {
          type: String,
          default:
            "https://donnysliststory.sfo3.digitaloceanspaces.com/profile/profile.png",
        },
        key: {
          type: String,
          default: "profile/profile.png",
        },
      },
    },
    nationality: {
      type: String},
    additionalLinks: {
      type:[],
      default:[]
    },
    coverImage: {
      type: {
        cdnUrl: {
          type: String,
        },
        location: {
          type: String,
        },
        key: {
          type: String,
        },
      },
    },
  },

  {
    timestamps: true,
  }
);

//= ===============================
// User ORM Methods
//= ===============================

// Pre-save of user to database, hash password if password is modified or new
// UserSchema.pre("save", function (next) {
//   const user = this
//   const SALT_FACTOR = 5;

//   bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
//     if (err) next(err);

//     bcrypt.hash(user.password, salt, (err1, hash) => {
//       if (err1) next(err1);
//       user.password = hash;
//       next();
//     });
//   });
// });
// Method to compare password for login
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    console.log("[USER]:[AUTH]:[ERROR]", err);
    if (err) {
      return cb(err);
    }

    cb(null, isMatch);
  });
};

module.exports = mongoose.model("User", UserSchema);
