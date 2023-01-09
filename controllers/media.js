const Media = require("../models/media");
const MediaComment = require("../models/mediaComments");
const { deleteMediaService } = require("../services/media");
const fs = require('fs');
const {
  deleteMediaCommentService,
} = require("../services/deleteMediaCommentService");
const { MEDIA_CDN_URL, s3 } = require("../config/s3");
const { deleteFile } = require("./uploaderController");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { getVideoDurationInSeconds } = require('get-video-duration');
const path = require("path");


ffmpeg.setFfmpegPath(ffmpegPath);
const ObjectId = require("mongoose").Types.ObjectId
exports.createMedia = async (req, res) => {
  const uploadedFiles = req.files.file;
  const uploadedThumbnails = req.files.thumbnail;



  if (!uploadedFiles || !uploadedThumbnails) {
    return res.status(400).json("no files or thumbnails uploaded")
  } else {
    let newMediaData = {
      ...req.body,
      file: uploadedFiles.map((file) => {
        return {
          location: file.location,
          key: file.key,
          cdnUrl: MEDIA_CDN_URL + "media/" + file.key,
        };
      }),

      thumbnail: uploadedThumbnails.map((file) => {
        return {
          location: file.location,
          key: file.key,
          cdnUrl: MEDIA_CDN_URL + "media/" + file.key,
        };
      })
    };

    const newMedia = new Media(newMediaData);
    try {
      const savedMedia = await newMedia.save();
      res.status(200).json(savedMedia);
    } catch (err) {
      res.status(500).json(err);
    }
  }


};
exports.createMediaWeb = async (req, res) => {
  try {
    console.log(req.body);
    const { media, community, tags, screenshots, ...rest } = req.body;
    // const {media,thumbnail,screenshots,...rest} = req.body;
    const uploadedThumbnails = req.files.thumbnail;
    console.log("media", req.files);
    // const blob = fs.readFileSync(global.DIRNAME+thumbnail,{encoding:'utf8', flag:'r'});
    // console.log('blob',blob);
    // const uploadedThumbnails = await s3.upload({
    //   Bucket: "donnysliststory/media",
    //   acl: "public-read",
    //   Key: thumbnail.split('/')[thumbnail.split('/').length-1],
    //   Body: blob,
    // }).promise();


    console.log('uploadfile', uploadedThumbnails);

    if (!media || !uploadedThumbnails) {
      return res.status(400).json("no files or thumbnails uploaded")
    } else {
      console.log(JSON.parse(media));
      let newMediaData = {
        ...rest,
        file: [JSON.parse(media)],
        thumbnail: uploadedThumbnails.map(e => ({
          location: e?.location,
          key: e?.key,
          cdnUrl: MEDIA_CDN_URL + "media/" + e?.key,
        })),
        community: community,
        tags: JSON.parse(tags),
        //  thumbnail:  [{
        //       location: uploadedThumbnails?.location,
        //       key: uploadedThumbnails?.key,
        //       cdnUrl: MEDIA_CDN_URL + "media/" + uploadedThumbnails?.key,
        //     }],

      };

      const newMedia = new Media(newMediaData);
      const savedMedia = await newMedia.save();
      // console.log(screenshots);

      screenshots?.split(',')?.forEach(e => {
        fs.unlinkSync(global.DIRNAME + e);
      });
      res.status(200).json(savedMedia);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};


exports.uploadMediaWeb = async (req, res) => {
  try {
    const uploadedFiles = req.file;
    const videoLength = await getVideoDurationInSeconds(uploadedFiles?.location);

    ffmpeg({ source: uploadedFiles?.location })
      .on('filenames', (filenames) => {
        imagePath = filenames?.map(e => '/screenshots/' + e);
        console.log('Created file names', filenames);
      })
      .on('end', (err, resp) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          return res.status(200).send({
            success: true,
            data: {
              videoUrl: {
                location: uploadedFiles.location,
                key: uploadedFiles.key,
                cdnUrl: MEDIA_CDN_URL + "media/" + uploadedFiles.key,
              },
              imageUrls: imagePath
            }
          })
        }
      })
      .takeScreenshots((() => {
        return {
          filename: new Date().getDate() + '-' + new Date().getMonth() + '-' + new Date().getFullYear() + '-' + new Date().getHours() + '-' + new Date().getMinutes() + '-' + 'ss.jpg',
          timemarks: [0, parseInt(videoLength / 8), parseInt(2 * videoLength / 8), parseInt(3 * videoLength / 8), parseInt(4 * videoLength / 8), parseInt(5 * videoLength / 8), parseInt(6 * videoLength / 8), parseInt(7 * videoLength / 8)]
        }
      })(), 'screenshots');

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.createMediaComment = async (req, res) => {
  const newMediaComment = new MediaComment(req.body);
  try {
    const savedMediaComment = await newMediaComment.save();
    res.status(200).json(savedMediaComment);
  } catch (err) {
    res.status(500).json(err);
  }
};

//update file
exports.editMedia = async (req, res) => {
  try {
    const { shareTo } = req.body
    const media = await Media.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { shares: { $each: shareTo } } },
      {
        new: true,
      }
    );
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

//upload to s3 bucket
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
        cdnUrl: MEDIA_CDN_URL + "media/" + uploadedFile.key,
      };
      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getAllUserMedia = async (req, res) => {
  try {
    const media = await Media.find({
      userSlug: req.params.userSlug,
    });
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};


exports.getMediaPost = async (req, res) => {
  try {
    const media = await Media.aggregate([
      { $match: { _id: ObjectId(req.params.id) } },
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
    ])
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getPaginatedUserMedia = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 10;
    const media = await Media.find({
      userSlug: req.params.userSlug
    }).sort({ updatedAt: -1 })
      .skip(req.query.page * itemSize)
      .limit(itemSize);
    res.status(200).json(media);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getPaginatedMediaComments = async (req, res) => {
  try {
    if (!req.query.page) return res.status(400).json('page query not provided');
    const itemSize = req.query.itemSize ? Number(req.query.itemSize) : 10;
    const comment = await MediaComment.aggregate([
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
        $match: { mediaId: req.params.mediaId },

      },

      {
        $sort: { updatedAt: -1 },
      },
      { $skip: req.query.page * itemSize },
      { $limit: itemSize }
    ]);

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteMediaComment = async (req, res) => {
  const result = await deleteMediaCommentService(req);
  res.status(result.statusCode).json(result.data);
};

exports.deleteMedia = async (req, res) => {
  const result = await deleteMediaService(req);

  result.data.file.forEach(({ key }) => {
    deleteFile(key, "media");
  });

  result.data.thumbnail.forEach(({ key }) => {
    deleteFile(key, "media");
  });

  res.status(result.statusCode).json(result.data);
  if (!result.error) {
    //   emit post event
    try {
      const deletedComment = await MediaComment.deleteMany({
        mediaId: result.data._id,
      });
      console.log("deleted comments", deletedComment);
    } catch (error) {
      console.log(error);
    }
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

exports.updatePlayCount = async (req, res) => {
  try{
    const mediaId = req.params.id;
    const media = await Media.findOne({_id:mediaId});
    if (!media){
      res.status(200).json("media not found")
    }
    const playcount =  media.playcounts ? media.playcounts : 0
    media.playcounts = playcount + 1
    media.save()
    res.status(200).json("added")
  }
  catch(error){    
    res.status(500).json(error)
  }}

  exports.getPlayCount = async (req, res) => {
    try{
      const mediaId = req.params.id;
      const media = await Media.findOne({_id:mediaId});
      if (!media){
        res.status(200).json("media not found")
      }
      const playcount =  media.playcounts ? media.playcounts : 0
      res.status(200).json(playcount)
    }
    catch(error){    
      console.log(error)
      res.status(500).json(error)
    }
}