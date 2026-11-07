const KhachHang = require("../../models/KHACH_HANG.model");
const keycloak = require("../../server/keycloak.server");

function render(req, res, pageTitle, view, extra) {
  res.render(
    view,
    Object.assign(
      {
        pageTitle,
        errorMessage: req.flash("error")[0] || "",
        successMessage: req.flash("success")[0] || "",
      },
      extra || {},
    ),
  );
}

module.exports.info = (req, res) => {
  const user = req.authUser;
  res.render("client/pages/user/info", {
    pageTitle: "Thông tin tài khoản - PetCare",
    user: {
      fullName: user.KH_HOTEN,
      email: user.KH_EMAIL,
      phone: user.KH_SDT,
    },
    successMessage: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || "",
  });
};

module.exports.edit = (req, res) =>
  render(req, res, "Chỉnh sửa thông tin - PetCare", "client/pages/user/edit", {
    user: req.authUser,
  });

module.exports.editPost = async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const phone = String(req.body.phone || "").trim();

  if (!fullName || fullName.length > 255) {
    req.flash("error", "Vui lòng nhập họ tên hợp lệ.");
    return res.redirect("/user/edit");
  }

  try {
    await KhachHang.UPDATE_PROFILE(req.authUser.KH_ID, { fullName, phone });
    req.session.auth.fullName = fullName;
    req.flash("success", "Cập nhật thông tin thành công.");
    return res.redirect("/user/info");
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ:", error.message);
    req.flash("error", "Không thể cập nhật thông tin.");
    return res.redirect("/user/edit");
  }
};

module.exports.resetPassword = (req, res) =>
  render(req, res, "Đổi mật khẩu - PetCare", "client/pages/user/resetPassword");

module.exports.resetPasswordPost = async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");
  const user = req.authUser;

  if (newPassword.length < 8 || newPassword !== confirmPassword) {
    req.flash("error", "Mật khẩu mới cần ít nhất 8 ký tự và hai ô phải khớp.");
    return res.redirect("/user/reset-password");
  }

  try {
    const tokens = await keycloak.login(user.KH_EMAIL, currentPassword);
    const tokenInfo = await keycloak.statusToken(tokens.access_token);
    if (!tokenInfo.active || tokenInfo.sub !== user.KH_KEYCLOAK) {
      req.flash("error", "Mật khẩu hiện tại không đúng.");
      return res.redirect("/user/reset-password");
    }

    await keycloak.resetPassword(user.KH_KEYCLOAK, newPassword);
    await keycloak
      .logoutUserSessions(user.KH_KEYCLOAK)
      .catch((error) =>
        console.error(
          "Không thể kết thúc các phiên Keycloak cũ:",
          error.message,
        ),
      );
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/auth/signin");
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error.message);
    req.flash(
      "error",
      "Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại.",
    );
    return res.redirect("/user/reset-password");
  }
};
