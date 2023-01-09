const MediaComment = require("../models/mediaComments");

const deleteMediaCommentService = async (req) => {
  try {
    const deletedMediaComment = await MediaComment.findByIdAndDelete(
      req.params.id
    );
    return {
      data: deletedMediaComment,
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
  deleteMediaCommentService,
};
