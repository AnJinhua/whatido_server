const Media = require("./models/media");
const mongoose = require("mongoose");
const config = require("./config/main");
const { deleteFile } = require('./controllers/uploaderController')

mongoose
  .connect(config.DB_URI || "mongodb://localhost:27017/donnyslist", {
    // config.DB_URI ||
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("database is connected!");
  })
  .catch((err) => {
    console.log("database not ready!");
    console.error(err);
  });
  var list =  []
// console.log(userreview)
Media.deleteMany({ mediaType: { $nin: ['video', 'videoText'] } }, async (er, ur) => {
console.log('done')
}
)

