const cloudinary = require("cloudinary").v2;

module.exports.upload = async (req, res, next) => {
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      // Gán đúng đường dẫn tuyệt đối từ Cloudinary trả về
      req.body.thumbnail = result.secure_url;
    } catch (error) {
      console.log("Lỗi upload ảnh lên Cloudinary:", error);
      req.body.thumbnail = "";
    }
  } else {
    // Nếu không chọn file mới, giữ nguyên hoặc để trống tùy ngữ cảnh
    req.body.thumbnail = req.body.thumbnail || "";
  }
  next();
};