require('dotenv').config()
const Story = require("../models/story");
const cron = require("node-cron");
const Follower = require("../models/followers");
const User = require("../models/user");
const Conversation = require("../models/conversation");
const {
  deleteExpiredStories,
  deleteStoryService,
} = require("../services/stories");
const { MEDIA_CDN_URL } = require("../config/s3");
const { deleteFile } = require("./uploaderController");
//send grid apis
const config = process.env;
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("./views/email-templates/notifications/"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views/email-templates/notifications/"),
};

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: config.SENDGRID_API,
    },
  })
);

transporter.use("compile", hbs(handlebarOptions));

//notify offline users
exports.sendEmailNotification = async (req, res) => {
  const { senderName, recieverEmail, message, recieverName, url } = req.body;
  const mailOptions = {
    from: `${senderName} via whatido <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, replied to your story`,
    template: "storyReply",
    context: {
      senderName: senderName,
      recieverName: recieverName,
      message: message,
      url: url,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`email notification sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
};

exports.createStory = async (req, res) => {
  const uploadedStoryFiles = req.files.story?.[0];
  const uploadedStoryThumbnail = req.files.thumbnail?.[0];

  let newStoryData;

  if (!uploadedStoryFiles && !uploadedStoryThumbnail) {
    newStoryData = {
      ...req.body,
    };
  } else {
    newStoryData = {
      ...req.body,
      file: {
        location: uploadedStoryFiles?.location,
        key: uploadedStoryFiles?.key,
        cdnUrl: MEDIA_CDN_URL + "story/" + uploadedStoryFiles?.key,
      },
      thumbnail: {
        location: uploadedStoryThumbnail?.location,
        key: uploadedStoryThumbnail?.key,
        cdnUrl: MEDIA_CDN_URL + "story/" + uploadedStoryThumbnail?.key,
      },
    };
  }
  //save and return the new story
  const newStory = new Story(newStoryData);
  try {
    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) {
    res.status(500).json(err);
  }
};


//using digital ocean spaces to store videos
exports.uploadS3 = async (req, res) => {
  try {
    const uploadedFile = req.files.file[0];

    if (!uploadedFile) {
      res.status(401).json({
        status: false,
        message: "File not uploaded",
      });
    } else {
      const resData = {
        location: uploadedFile.location,
        key: uploadedFile.key,
        cdnUrl: MEDIA_CDN_URL + "story/" + uploadedFile.key,
      };
      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getYourStories = async (req, res) => {
  try {
    const userSlug = req.params.slug;
    const userCommunity = (await User.findOne({ slug: userSlug })).community;
    const following = await Follower.find({ userSlug: userSlug });
    const members = await Conversation.find({ members: { $in: userSlug } });
    const peer = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = 0; j < members[i].members.length; j++) {
        if (members[i].members[j] !== userSlug) {
          peer.push(members[i].members[j]);
        }
      }
    }
    const followingList = following;
    const followingCommunity = [];
    const followingPeer = [];
    if (followingList) {
      await followingList.filter((a) => {
        if (a.type === "community") {
          return followingCommunity.push(a.community);
        } else {
          return followingPeer.push(a.userSlug);
        }
      });
    }
    const story = await Story.aggregate([
      
        {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: "users",
          let: { user_slug: "$userSlug" },
          pipeline: [
            { $match: { $expr: { $eq: ["$slug", "$$user_slug"] } }, },
            {
              $project: {
                _id: 1,
                profile: 1,
                email: 1,
                "imageUrl.cdnUrl": 1,
                slug: 1,

              }
            }
          ],
          as: "user"
        }
      },
      {
        $match: {
          $or: [
            { community: userCommunity },
            { community: followingCommunity },
            { userSlug: { $in: followingPeer } },
            { userSlug: { $in: peer } },
          ]
        },
      },

      {
        $sort: { updatedAt: -1 },
      },
    
    ])
    res.status(200).json(story);
  } catch (err) {
    console.log(err)
    res.status(500).json(err);
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileKey = req.params.key;
    const path = req.params.path;
    const deletedFile = await deleteFile(fileKey, path);
    res.status(200).json(deletedFile);
  } catch (error) {
    console.log(error);
  }
};

//get all stories by userSlug within last 48 hours
exports.getAllUserStories = async (req, res) => {
  try {
    const story = await Story.find({
      userSlug: req.params.userSlug,
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json(err);
  }
};

// get all sub categories of an expert category
exports.getCommunityStory = async (req, res) => {
  try {
    const story = await Story.find({
      community: req.params.community,
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.viewUserStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    story.views.push(req.body.view);
    story.views = [...new Set(story.views)];
    await story.save();
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get story by id
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const deletedStory = await Story.findByIdAndDelete(req.params.id);
    const thumbnailKey = deletedStory.thumbnail.key;
    const fileKey = deletedStory.file.key;
    await deleteFile(fileKey, "story");
    await deleteFile(thumbnailKey, "story");
    res.status(200).json(deletedStory);
  } catch (error) {
    res.status(500).json(error);
  }
};

cron.schedule("0 0 * * *", async () => {
  try {
    // gets expired stories from db
    const getStories = await deleteExpiredStories();
    const stories = getStories.stories;

    stories.forEach((deletedStory) => {
      const thumbnailKey = deletedStory.thumbnail.key;
      const fileKey = deletedStory.file.key;
      deleteFile(fileKey, "story");
      deleteFile(thumbnailKey, "story");
    });

    // delete expired stories from db
    await Story.deleteMany({
      createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });
  } catch (error) {
    console.log("error", error);
  }
});
