const keycloak = require("../server/keycloak.server");
const KhachHang = require("../models/KHACH_HANG.model");
const NhanVien = require("../models/NHAN_VIEN.model");

async function getActiveToken(req) {
  if (!req.session || !req.session.accessToken) return null;

  try {
    const status = await keycloak.statusToken(req.session.accessToken);
    if (status && status.active) return status;
  } catch (error) {
    // Thử gia hạn bằng refresh token khi access token hết hạn.
  }

  if (!req.session.refreshToken) return null;

  try {
    const tokens = await keycloak.refreshToken(req.session.refreshToken);
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.expiresAt = Date.now() + tokens.expires_in * 1000;
    const status = await keycloak.statusToken(tokens.access_token);
    if (status && status.active) return status;
  } catch (error) {
    return null;
  }

  return null;
}

function attachSessionUser(req, res, next) {
  const auth = req.session && req.session.auth;
  res.locals.khach_hang =
    auth && auth.type === "customer"
      ? { fullName: auth.fullName, email: auth.email }
      : null;
  res.locals.admin =
    auth && auth.type === "admin"
      ? { fullName: auth.fullName, email: auth.email }
      : null;
  next();
}

async function requireCustomer(req, res, next) {
  try {
    const auth = req.session && req.session.auth;
    if (!auth || auth.type !== "customer") {
      req.flash("error", "Đăng nhập để tiếp tục.");
      return res.redirect("/auth/signin");
    }

    const token = await getActiveToken(req);
    if (!token || token.sub !== auth.keycloakId) {
      req.flash("error", "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return res.redirect("/auth/signin");
    }

    const user = await KhachHang.SELECT_KH("KH_ID", auth.userId);
    if (
      !user ||
      user.KH_TRANGTHAI !== "active" ||
      user.KH_KEYCLOAK !== token.sub
    ) {
      req.flash("error", "Tài khoản không hoạt động.");
      return res.redirect("/auth/signin");
    }

    req.authUser = user;
    res.locals.khach_hang = { fullName: user.KH_HOTEN, email: user.KH_EMAIL };
    return next();
  } catch (error) {
    console.error("Lỗi xác thực khách hàng:", error);
    req.flash("error", "Không thể xác thực tài khoản. Vui lòng đăng nhập lại.");
    return res.redirect("/auth/signin");
  }
}

async function requireAdmin(req, res, next) {
  try {
    const auth = req.session && req.session.auth;
    if (!auth || auth.type !== "admin") {
      req.flash("error", "Đăng nhập quản trị viên để tiếp tục.");
      return res.redirect("/admin/auth/signin");
    }

    const token = await getActiveToken(req);
    if (!token || token.sub !== auth.keycloakId) {
      req.flash("error", "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return res.redirect("/admin/auth/signin");
    }

    const roles = await keycloak.getRealmRoles(token.sub);
    const adminRole = process.env.KEYCLOAK_ROLE_ADMIN || "ADMIN";
    if (!roles.some((role) => role.name === adminRole)) {
      req.flash("error", "Tài khoản không có quyền quản trị.");
      return res.redirect("/admin/auth/signin");
    }

    const user = await NhanVien.SELECT_NV("NV_ID", auth.userId);
    if (
      !user ||
      user.NV_TRANGTHAI !== "active" ||
      user.NV_KEYCLOAK !== token.sub
    ) {
      req.flash("error", "Tài khoản nhân viên không hoạt động.");
      return res.redirect("/admin/auth/signin");
    }

    req.authUser = user;
    res.locals.admin = { fullName: user.NV_HOTEN, email: user.NV_EMAIL };
    return next();
  } catch (error) {
    console.error("Lỗi xác thực quản trị viên:", error);
    req.flash("error", "Không thể xác thực quyền quản trị.");
    return res.redirect("/admin/auth/signin");
  }
}

module.exports = { attachSessionUser, requireCustomer, requireAdmin };
