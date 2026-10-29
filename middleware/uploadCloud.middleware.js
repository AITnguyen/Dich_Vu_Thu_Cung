const multer = require("multer");
const path = require("path");

// Cấu hình nơi lưu trữ và tên file trên ổ đĩa
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Đảm bảo thư mục public/uploads đã tồn tại trong dự án của bạn
    cb(null, "./public/uploads/");
  },
  filename: function (req, file, cb) {
    // Tạo tên file độc nhất bằng cách kết hợp thời gian hiện tại và tên gốc
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Xuất middleware xử lý 1 file có tên field là "thumbnail"
module.exports.upload = upload.single("thumbnail");
