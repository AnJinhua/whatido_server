const Conversation = require("../models/conversation");
const Message = require("../models/message");
const User = require("../models/user");
const {
  createConversationService,
  updateConversationService,
} = require("../services/conversation");

//conversation route
exports.createConversation = async (req, res) => {
  const result = await createConversationService(req);
  res.status(result.statusCode).json(result.data);
};

//update a conversation
exports.updateConversation = async (req, res) => {
  const result = await updateConversationService(req);
  res.status(result.statusCode).json(result.data);
};
//get all conversations by user id
exports.getAllConversations = async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.id] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get active conversations by id
exports.getActiveCoversation = async (req, res) => {
  try {
    const slug = req.params.id
    var conversation = await Conversation.find({
      members: { $in: [slug] },
      deleted: { $ne: [slug] },
    }, { lastReciever: 0, blocked: 0, deleted: 0, archived: 0 }).lean();
    let all = []
    let conversation_id = []
    conversation.filter(pre => {
      conversation_id.push(String(pre["_id"]))
      for (let i = 0; i < pre.members.length; i++) {
        if (pre.members[i] !== req.params.id) {
          all.push(pre.members[i])
        }

      }
    });

    const messages = await Message.aggregate([
      {
        "$match": {
          "conversationId":
          {
            "$in": conversation_id
          }
        }
      },

      {
        "$group": {
          "_id": "$conversationId",
          "latestDate": {
            "$max": {
              "$mergeObjects": [
                {
                  "updated": "$updated"
                },
                "$$ROOT"
              ]
            }
          }
        }
      },
      {
        "$addFields": {
          "id": "$_id"
        }
      },
      {
        "$project": {
          "_id": 0
        }
      },
      {
        "$unwind": {
          "path": "$latestDate"
        }
      },
      {
        "$replaceRoot": {
          "newRoot": "$latestDate"
        }
      }
    ]
    )
    const avaters = await User.find({ slug: { $in: all } }, { profile: 1, imageUrl: 1, slug: 1 });
    for (let i = 0; i < conversation.length; i++) {
      for (let j = 0; j < avaters.length; j++) {
        if (conversation[i]['members'].includes(avaters[j]['slug'])) {
          conversation[i] = { ...conversation[i] }
          conversation[i].profile = avaters[j]['profile']
          conversation[i].imageUrl = avaters[j]['imageUrl']?.['cdnUrl']
          conversation[i].slug = avaters[j]['slug']
        }

      };
      for (let k = 0; k < messages.length; k++) {
        if (conversation[i]['_id'] == messages[k]['conversationId']) {
          conversation[i].message = messages[k]
        }
      }
    }
    res.status(200).json(conversation);
  } catch (err) {
    console.log(err)
    res.status(500).json(err);
  }
};

exports.getBuggyConversations = async (req, res) => {
  try {
    //get all conversations that has null in members array
    const conversation = await Conversation.find({
      members: { $in: ["null"] },
    });
    // const conversation = await Conversation.find({
    //   members: { $in: [null] },
    // });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get ongoing conversations by id
exports.getOngoingCoversation = async (req, res) => {
  try {
    //find ongoing conversations and sort from latest to oldest
    const conversation = await Conversation.find({
      members: { $in: [req.params.id] },
      deleted: { $ne: [req.params.id] },
      archived: { $ne: [req.params.id] },
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.getPageOngoingCoversation = async (req, res) => {
  try {
    //find ongoing conversations and sort from latest to oldest
    const slug = req.params.id
    var conversation = await Conversation.find({
      members: { $in: [req.params.id] },
      deleted: { $ne: [req.params.id] },
      archived: { $ne: [req.params.id] },
    }, { lastReciever: 0, blocked: 0, deleted: 0, archived: 0 })
      .sort({ updatedAt: -1 })
      .skip(req.query.page * 10)
      .limit(10)
      .lean();
    let all = []
    let conversation_id = []
    conversation.filter(pre => {
      conversation_id.push(String(pre["_id"]))
      for (let i = 0; i < pre.members.length; i++) {
        if (pre.members[i] !== req.params.id) {
          all.push(pre.members[i])
        }

      }
    });

    const messages = await Message.aggregate([
      {
        "$match": {
          "conversationId":
          {
            "$in": conversation_id
          }
        }
      },

      {
        "$group": {
          "_id": "$conversationId",
          "latestDate": {
            "$max": {
              "$mergeObjects": [
                {
                  "updated": "$updated"
                },
                "$$ROOT"
              ]
            }
          }
        }
      },
      {
        "$addFields": {
          "id": "$_id"
        }
      },
      {
        "$project": {
          "_id": 0
        }
      },
      {
        "$unwind": {
          "path": "$latestDate"
        }
      },
      {
        "$replaceRoot": {
          "newRoot": "$latestDate"
        }
      }
    ]
    )
    const avaters = await User.find({ slug: { $in: all } }, { profile: 1, imageUrl: 1, slug: 1 });
    for (let i = 0; i < conversation.length; i++) {
      for (let j = 0; j < avaters.length; j++) {
        if (conversation[i]['members'].includes(avaters[j]['slug'])) {
          conversation[i] = { ...conversation[i] }
          conversation[i].profile = avaters[j]['profile']
          conversation[i].imageUrl = avaters[j]['imageUrl']?.['cdnUrl']
          conversation[i].slug = avaters[j]['slug']
        }

      };
      for (let k = 0; k < messages.length; k++) {
        if (conversation[i]['_id'] == messages[k]['conversationId']) {
          conversation[i].message = messages[k]
        }
      }
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
//get archived conversation
exports.getArchivedCoversation = async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.id] },
      archived: { $in: [req.params.id] },
      deleted: { $ne: [req.params.id] },
    });

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//check if conversations between two members exists
exports.findUsersConversation = async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    }, { lastReciever: 0, blocked: 0, deleted: 0, archived: 0 }).lean();
    if (!conversation){
      return res.status(200).json(null)
    }
    const avater = await User.findOne({ slug: req.params.secondUserId }, { profile: 1, imageUrl: 1, slug: 1 });
    conversation.profile = avater['profile']
    conversation.imageUrl = avater['imageUrl']?.['cdnUrl']
    conversation.slug = avater['slug']
    res.status(200).json(conversation);
  } catch (err) {
    console.log(err)
    res.status(500).json(err);
  }
};
//get conversation by id
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
//update conversation by taking req.body.archived and add to monogose archived array
exports.addArchiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        $push: { archived: req.body.archived },
      },
      {
        new: true,
      }
    );

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
//update archived conversation by removing req.body.archived from monogose archived array
exports.restoreArchiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { archived: req.body.archived },
      },
      {
        new: true,
      }
    );
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//update conversation by taking req.body.blocked and add to monogose archived array
exports.blockConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        $push: { blocked: req.body.blocked },
      },
      {
        new: true,
      }
    );

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
//update archived conversation by removing req.body.blocked from monogose archived array
exports.unBlockConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { blocked: req.body.blocked },
      },
      {
        new: true,
      }
    );
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//delete conversation from database by id
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//temprorary delete conversation

exports.tempDeleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      {
        $push: { deleted: req.body.deleted },
      },
      {
        new: true,
      }
    );
    // update conversation messages by adding deleted user to deleted array
    const messages = await Message.find({ conversationId: conversation._id });
    messages.forEach((message) => {
      message.deleted.push(req.body.deleted);
      message.save();
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};

//function that removes req.body.restored from mongoose deleted and archived array
exports.restoreTempDeletedConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    conversation.deleted.pull(req.body.restored);
    conversation.archived.pull(req.body.restored);
    conversation.save();

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
//function that permanently deletes conversation from database and find all messages of conversation_id and delete them
exports.permanentDeleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    const messages = await Message.find({ conversationId: conversation._id });
    messages.forEach((message) => {
      message.remove();
    });
    conversation.remove();
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
};
