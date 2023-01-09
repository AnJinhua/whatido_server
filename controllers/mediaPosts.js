const Media = require("../models/media");

exports.getPaginatedMedia = async (req, res) => {
  try {
    const media = await Media.find({
      mediaType: "video",
    })
      .sort({ createdAt: -1 })
      .skip(req.query.page * 20)
      .limit(20);
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.likeVideo = async (req, res) => {
  const { id, userSlug } = req.body;

  try {
    const videoPost = await Media.findById(id);
    videoPost.inspired.push(userSlug);
    const updatedVideoPost = await Media.findByIdAndUpdate(id, videoPost, {
      new: true,
    });

    res.status(200).json(updatedVideoPost);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.unlikeVideo = async (req, res) => {
  const { id, userSlug } = req.body;

  try {
    const videoPost = await Media.findById(id);
    videoPost.inspired = videoPost.inspired.filter(
      (id) => id !== String(userSlug)
    );
    const updatedVideoPost = await Media.findByIdAndUpdate(id, videoPost, {
      new: true,
    });

    res.status(200).json(updatedVideoPost);
  } catch (err) {
    res.status(500).json(err);
  }
};
