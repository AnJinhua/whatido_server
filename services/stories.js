const Story = require("../models/story");

const deleteExpiredStories = async () => {
  try {
    const expiredStories = await Story.find({
      createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });

    return {
      stories: expiredStories,
      error: false,
      message: "success",
      statusCode: 201,
    };
  } catch (error) {
    return {
      stories: {},
      error: true,
      message: "Sorry an error occurred",
      statusCode: 500,
    };
  }
};
// findByIdAndDelete
const deleteStoryService = async (req) => {
  try {
    const deletedStory = await Story.findByIdAndDelete(req.params.id);
    return {
      data: deletedStory,
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
  deleteExpiredStories,
  deleteStoryService,
};
