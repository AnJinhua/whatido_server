const EndpointModel = require("../../models/endpoint");

const getAllSubscriptions = async (userSlug) => {
  try {
    const allEndpoints = await EndpointModel.find({
      userSlug: { $ne: userSlug },
    });

    return {
      data: allEndpoints,
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

module.exports = getAllSubscriptions;
