const KhachHang = require("../../models/KHACH_HANG.model");

module.exports.signin = (req, res) => {
  res.render("client/pages/auth/signin", {
    pageTitle: "Đăng nhập tài khoản",
  });
};

module.exports.signinPost = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await KhachHang.SELECT_KH("KH_EMAIL", email);
    if (!user) {
      console.log("Email không tồn tại trong hệ thống!");
      return res.redirect("/auth/signin");
    }

    if (user.KH_MATKHAU !== password) {
      console.log("Mật khẩu không chính xác!");
      return res.redirect("/auth/signin");
    }

    req.session.khach_hang = {
      id: user.KH_ID,
      fullName: user.KH_HOTEN,
      email: user.KH_EMAIL,
    };

    console.log("Đăng nhập tài khoản thành công!");
    res.redirect("/");
  } catch (error) {
    console.log("Lỗi trong quá trình đăng nhập:", error);
    res.redirect("/auth/signin");
  }
};

module.exports.signup = (req, res) => {
  res.render("client/pages/auth/signup", {
    pageTitle: "Đăng ký tài khoản",
  });
};

module.exports.signupPost = async (req, res) => {
  try {
    const { fullName, email, password, sdt, cccd } = req.body;

    const existEmail = await KhachHang.findDuplication("KH_EMAIL", email);
    if (existEmail) {
      console.log("Email này đã được sử dụng bởi tài khoản khác!");
      return res.redirect("/auth/signup");
    }

    const today = new Date().toISOString().slice(0, 10);

    await KhachHang.INSERT({
      KH_HOTEN: fullName,
      KH_EMAIL: email,
      KH_MATKHAU: password,
      KH_SDT: sdt || null,
      KH_CCCD: cccd || null,
      KH_NGAYTAO: today,
    });

    console.log("Đăng ký tài khoản thành công!");
    res.redirect("/auth/signin");
  } catch (error) {
    console.log("Lỗi chi tiết khi đăng ký:", error);
    res.redirect("/auth/signup");
  }
};

module.exports.signout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Lỗi khi đăng xuất:", err);
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/signin");
  });
};
