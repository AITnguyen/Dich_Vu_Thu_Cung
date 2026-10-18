const mongoose = require("mongoose");
module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("connect mongoose success");
  } catch (error) {
    console.log(error);
    console.log("connect mongoose error");
  }
};
