const KhachHang = require("../../models/KHACH_HANG.model");

module.exports.signup = async (req, res) => {
  try {
    res.render("client/pages/auth/signup", {
      title: "Đăng ký tài khoản - PetCare",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

module.exports.signupPost = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await KhachHang.SELECT_KH("KH_EMAIL", email);
    if (existingUser) {
      console.log("Email này đã được sử dụng!");
      return res.redirect("/auth/signup");
    }

    const today = new Date().toISOString().slice(0, 10);

    await KhachHang.INSERT({
      KH_HOTEN: fullName,
      KH_EMAIL: email,
      KH_MATKHAU: password,
      KH_SDT: null,
      KH_NGAYTAO: today,
    });

    console.log("Đăng ký tài khoản thành công!");
    res.redirect("/auth/signin");
  } catch (error) {
    console.log("Lỗi khi đăng ký:", error);
    res.redirect("/auth/signup");
  }
};

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

module.exports.signinPost = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await KhachHang.SELECT_KH("KH_EMAIL", email);

    if (!user || user.KH_MATKHAU !== password) {
      console.log("Email hoặc mật khẩu không chính xác!");
      return res.redirect("/auth/signin");
    }

    req.session.userId = user.KH_ID;
    console.log("Đăng nhập thành công!");
    res.redirect("/");
  } catch (error) {
    console.log("Lỗi khi đăng nhập:", error);
    res.redirect("/auth/signin");
  }
};
