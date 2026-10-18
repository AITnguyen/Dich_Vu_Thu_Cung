const db = require("../../config/database"); // Tệp cấu hình kết nối SQL của bạn (ví dụ: mysql2)

// [GET] /auth/signin - Hiển thị trang đăng nhập
module.exports.signin = async (req, res) => {
  try {
    res.render("client/pages/auth/signin", {
      title: "Đăng nhập - PetCare",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [POST] /auth/signin - Xử lý đăng nhập bằng SQL
module.exports.signinPost = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Truy vấn dữ liệu khách hàng từ cơ sở dữ liệu SQL
    const [rows] = await db.execute(
      "SELECT * FROM khach_hang WHERE email = ? AND deleted = 0",
      [email],
    );
    const user = rows[0];

    if (!user) {
      console.log("Email không tồn tại trong hệ thống!");
      return res.redirect("back");
    }

    if (user.password !== password) {
      console.log("Mật khẩu không chính xác!");
      return res.redirect("back");
    }

    // Lưu ID vào session sau khi đăng nhập thành công
    req.session.userId = user.id;
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("back");
  }
};

// [GET] /auth/signup - Hiển thị trang đăng ký
module.exports.signup = async (req, res) => {
  try {
    res.render("client/pages/auth/signup", {
      title: "Đăng ký - PetCare",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [POST] /auth/signup - Xử lý thêm khách hàng mới vào SQL
module.exports.signupPost = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Kiểm tra xem email đã tồn tại hay chưa
    const [existingRows] = await db.execute(
      "SELECT * FROM khach_hang WHERE email = ?",
      [email],
    );

    if (existingRows.length > 0) {
      console.log("Email này đã được sử dụng!");
      return res.redirect("back");
    }

    // Thêm bản ghi mới vào bảng khach_hang
    await db.execute(
      "INSERT INTO khach_hang (fullName, email, password, phone, deleted) VALUES (?, ?, ?, ?, 0)",
      [fullName, email, password, phone],
    );

    res.redirect("/auth/signin");
  } catch (error) {
    console.log(error);
    res.redirect("back");
  }
};
