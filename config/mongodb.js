const mongoose = require("mongoose");

module.exports.connect = async () => {
  if (!process.env.MONGODB) {
    throw new Error("Cần khai báo MONGODB trong file .env");
  }

  await mongoose.connect(process.env.MONGODB);
  console.log("Kết nối MongoDB thành công");
};
