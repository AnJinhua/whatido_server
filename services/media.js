const Media = require("../models/media");

const deleteMediaService = async (req) => {
  try {
    const deletedMedia = await Media.findByIdAndDelete(req.params.id);
    return {
      data: deletedMedia,
      error: false,
      message: "success",
      statusCode: 201,
    };
  } catch (error) {
    return {
      data: {},
      error: true,
      message: "Sorry an error occurred",
      statusCode: 500,
    };
  }
};

module.exports = {
  deleteMediaService,
};
