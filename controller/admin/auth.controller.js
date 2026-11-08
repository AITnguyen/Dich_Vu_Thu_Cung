const NhanVien = require("../../models/NHAN_VIEN.model");
const keycloak = require("../../server/keycloak.server");
const authSession = require("../../helper/authSession.helper");

const ADMIN_ROLE = process.env.KEYCLOAK_ROLE_ADMIN || "ADMIN";

module.exports.signin = (req, res) => {
  res.render("admin/pages/auth/signin", {
    pageTitle: "Đăng nhập quản trị viên",
    errorMessage: req.flash("error")[0] || "",
  });
};

module.exports.signinPost = async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  let refreshToken = "";

  try {
    const staff = await NhanVien.SELECT_NV("NV_EMAIL", email);
    if (!staff || staff.NV_TRANGTHAI !== "active") {
      req.flash("error", "Email hoặc mật khẩu không đúng.");
      return res.redirect("/admin/auth/signin");
    }

    const tokens = await keycloak.login(email, password);
    refreshToken = tokens.refresh_token;

    const tokenInfo = await keycloak.statusToken(tokens.access_token);
    console.log("Keycloak token check:", {
      active: tokenInfo?.active,
      hasSub: Boolean(tokenInfo?.sub),
    });

    if (!tokenInfo.active || !tokenInfo.sub) {
      throw new Error("Keycloak không xác thực được tài khoản");
    }

    const roles = await keycloak.getRealmRoles(tokenInfo.sub);
    if (!roles.some((role) => role.name === ADMIN_ROLE)) {
      await keycloak.logout(tokens.refresh_token).catch(() => {});
      refreshToken = "";
      req.flash("error", "Tài khoản Keycloak chưa được cấp quyền quản trị.");
      return res.redirect("/admin/auth/signin");
    }

    if (staff.NV_KEYCLOAK && staff.NV_KEYCLOAK !== tokenInfo.sub) {
      await keycloak.logout(tokens.refresh_token).catch(() => {});
      refreshToken = "";
      req.flash("error", "Tài khoản Keycloak không khớp hồ sơ nhân viên.");
      return res.redirect("/admin/auth/signin");
    }

    if (!staff.NV_KEYCLOAK) {
      await NhanVien.UPDATE_KEYCLOAK(staff.NV_ID, tokenInfo.sub);
    }

    await authSession.start(req, {
      auth: {
        type: "admin",
        userId: staff.NV_ID,
        keycloakId: tokenInfo.sub,
        fullName: staff.NV_HOTEN,
        email: staff.NV_EMAIL,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    req.flash("success", "Đăng nhập thành công.");
    return res.redirect("/admin/dashboard");
  } catch (error) {
    if (refreshToken) await keycloak.logout(refreshToken).catch(() => {});

    console.error("Lỗi đăng nhập quản trị viên:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      keycloakError: error.response?.data,
    });

    req.flash("error", "Email hoặc mật khẩu không đúng.");
    return res.redirect("/admin/auth/signin");
  }
};

module.exports.signout = async (req, res) => {
  const refreshToken = req.session && req.session.refreshToken;

  if (refreshToken) {
    try {
      await keycloak.logout(refreshToken);
    } catch (error) {
      console.error("Lỗi kết thúc phiên Keycloak:", error.message);
    }
  }

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/admin/auth/signin");
  });
};
