const EndpointModel = require("../../models/endpoint");

const getUserEndpoints = async (userSlug) => {
  try {
    const userEndpoints = await EndpointModel.find({ userSlug });

    return {
      data: userEndpoints,
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

module.exports = getUserEndpoints;
