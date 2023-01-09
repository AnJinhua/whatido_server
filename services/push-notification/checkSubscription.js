const EndpointModel = require("../../models/endpoint");

// const getSubscriptions = async (endpoint, userSlug) => {
//   try {
//     const userSubscriptions = await EndpointModel.find({
//       endpoint: endpoint,
//       userSlug: userSlug,
//     });

//     return {
//       data: userSubscriptions,
//       error: false,
//       message: "success",
//       statusCode: 201,
//     };
//   } catch (error) {
//     return {
//       data: {},
//       error: true,
//       message: "Sorry an error occurred",
//       statusCode: 500,
//     };
//   }
// };

const getEndpoints = async (endpoint) => {
  try {
    const endpoints = await EndpointModel.find({ endpoint: endpoint });

    return {
      data: endpoints,
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

module.exports = getEndpoints;
