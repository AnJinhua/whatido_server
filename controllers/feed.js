const Follower = require("../models/followers");
const User = require("../models/user");
const Media = require("../models/media");
const Conversation = require("../models/conversation");

exports.getForYou = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const userSlug = req.params.slug;
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 12;
    const userCommunity = (await User.findOne({ slug: userSlug })).expertMainCategory;
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
    const media = await Media.aggregate([
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
      { $skip: req.query.page * itemSize },
      { $limit: itemSize }
    ])
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.getInspiring = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 12;
    const media = await Media.aggregate([
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
        $addFields: { inspired_count: { $size: { $ifNull: ["$inspired", []] } } },
      },
      {
        $sort: { inspired_count: -1, updatedAt: -1 },
      },
    ])
      .skip(req.query.page * itemSize)
      .limit(itemSize);
    console.log(media);
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getNoneUserForYou = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 12;
    const media = await Media.aggregate([
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
        $addFields: {
          inspired_count: { $size: { $ifNull: ["$inspired", []] } },
        },
      },
      {
        $sort: { updatedAt: -1, inspired_count: -1 },
      },
    ])
      .skip(req.query.page * itemSize)
      .limit(itemSize);
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getCommunity = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 12;
    const community = req.params.community;
    const media = await Media.aggregate([
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
        $match: { community: community },

      },

      {
        $sort: { updatedAt: -1 },
      },
      { $skip: req.query.page * itemSize },
      { $limit: itemSize }
    ]);
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getTenPeers = async (req, res) => {
  try {
    const userSlug = req.params.slug;
    const members = await Conversation.find({ members: { $in: userSlug } })
      .sort({ updatedAt: -1 })
      .limit(50);
    const peer = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = 0; j < members[i].members.length; j++) {
        if (members[i].members[j] !== userSlug) {
          peer.push(members[i].members[j]);
        }
      }
    }
    res.status(200).json(peer);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getDiscover = async (req, res) => {
  try {
    const tusers = await User.aggregate([
      {
        $group: {
          _id: '$expertMainCategory',
          avater: { "$addToSet": { "imageUrl": "$imageUrl" } },
          total_users: { $sum: 1 }
        }
      }
    ]
    );
    const tpost = await Media.aggregate([
      {
        $group: {
          _id: '$community',
          total_post: { $sum: 1 },
          thumbnail: { "$addToSet": { "thumbnail": "$thumbnail" } }
        }
      }
    ]);


    for (let i = 0; i < tusers.length; i++) {
      for (let j = 0; j < tpost.length; j++) {
        if (tusers[i]['_id'] === tpost[j]['_id']) {
          tusers[i]['thumbnail'] = tpost[j]['thumbnail'].slice(-4)
          tusers[i]['total_post'] = tpost[j]['total_post']
        }
        tusers[i]['avater'] = tusers[i]['avater'].filter(
          avat => Object.keys(avat).length !== 0
        ).slice(0, 4)
      };
    }
    const total = tusers.filter(user => user['total_post'] > 0)
    res.status(200).json({
      totalExperts: total
    });
  }
  catch (err) {
    res.status(500).json(err);
  }
};

exports.getExpertDiscover = async (req, res) => {
  try {
    const tpost = await Media.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userSlug',
          foreignField: 'slug',
          as: 'user',
        }
      },
      { $unwind: '$user' },

      {
        $addFields: { inspired_count: { $size: { $ifNull: ["$inspired", []] } } },
      },
      {
        $lookup: {
          from: 'followers',
          localField: 'userSlug',
          foreignField: 'following',
          as: 'follower',
        }
      },
      { $unwind: { path: '$follower', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$userSlug',
          total_post: { $sum: 1 },
          total_inspired: { "$sum": "$inspired_count" },
          thumbnail: { "$addToSet": { "thumbnail": "$thumbnail.cdnUrl" } },
          avater: { "$addToSet": { "avater": "$user.imageUrl.cdnUrl" } },
          total_follower: { "$addToSet": { "avater": "$user.imageUrl.cdnUrl" } },
          profile: { "$addToSet": { "profile": "$user.profile" } },
        }
      },
      {
        $sort: { total_post: -1, total_inspired: -1, updatedAt: -1 },
      },
    ]);


    for (let j = 0; j < tpost.length; j++) {
      tpost[j]['thumbnail'] = tpost[j]['thumbnail'].slice(0, 4)
    }

    res.status(200).json({
      totalExperts: tpost
    });
  }
  catch (err) {
    res.status(500).json(err);
  }
};
exports.getExpertCommunityDiscover = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const community = req.params.community
    const users = await User.find({ expertMainCategory: community }, {
      slug: 1, expertMainCategory: 1
      , profile: 1, onlineStatus: 1, imageUrl: 1, email: 1, expertCategories: 1
    })
      .skip(req.query.page * 20)
      .limit(20);
    res.status(200).json(users);
  }
  catch (err) {
    res.status(500).json(err);
  }
};

exports.getDiscoverBanner = async (req, res) => {
  try {
    const tpost = await Media.aggregate([
      {
        $addFields: { inspired_count: { $size: { $ifNull: ["$inspired", []] } } },
      },
      {
        $group: {
          _id: '$community',
          thumbnail: { "$addToSet": { "thumbnail": "$thumbnail.cdnUrl", "inspired_count": "$inspired_count", "updatedAt": "$updatedAt", "id":"$_id" } },

        }
      },
      {
        $sort: { "thumbnail.inspired_count": -1, "thumbnail.updatedAt": -1 },
      },
    ]);


    for (let j = 0; j < tpost.length; j++) {
      tpost[j]['thumbnail'] = tpost[j]['thumbnail'].slice(0, 1)
    };

    res.status(200).json({
      totalExperts: tpost
    });
  }
  catch (err) {
    res.status(500).json(err);
  }
};

exports.getTotalPostandUsers = async (req, res) => {
  try {
    const community = req.params.community
    const tusers = await User.aggregate([
      {
        $match: {
          expertMainCategory: community,
        }
      },
      {
        $group: {
          _id: null,
          total_users: { $sum: 1 }
        }
      }
    ]
    );
    const tpost = await Media.aggregate([
      {
        $match: {
          community: community
        }
      },
      {
        $group: {
          _id: null,
          total_post: { $sum: 1 },
        }
      }
    ]);
    res.status(200).json([
      ...tusers, ...tpost
    ]);
  }
  catch (err) {
    res.status(500).json(err);
  }
};
