const KhachHang = require("../models/KHACH_HANG.model");
const NhanVien = require("../models/NHAN_VIEN.model");
const OTP = require("../helper/otp.helper");
const sendMail = require("../helper/sendMail.helper");
const keycloak = require("../server/keycloak.server");

function basePath(type) {
  return type === "admin" ? "/admin/auth" : "/auth";
}

function purpose(type) {
  return type === "admin" ? "reset_admin" : "reset_customer";
}

async function findAccount(type, email) {
  const user =
    type === "admin"
      ? await NhanVien.SELECT_NV("NV_EMAIL", email)
      : await KhachHang.SELECT_KH("KH_EMAIL", email);
  if (
    !user ||
    user[type === "admin" ? "NV_TRANGTHAI" : "KH_TRANGTHAI"] !== "active"
  ) {
    return null;
  }
  return user;
}

async function resolveKeycloakId(type, user) {
  const idField = type === "admin" ? "NV_KEYCLOAK" : "KH_KEYCLOAK";
  const emailField = type === "admin" ? "NV_EMAIL" : "KH_EMAIL";
  const linkedId = user[idField];
  const matches = await keycloak.checkUsername(user[emailField]);
  const account = matches.find(
    (item) =>
      item.email === user[emailField] || item.username === user[emailField],
  );
  if (!account) return null;
  if (linkedId && linkedId !== account.id) return null;

  const roles = await keycloak.getRealmRoles(account.id);
  const expectedRole =
    type === "admin"
      ? process.env.KEYCLOAK_ROLE_ADMIN || "ADMIN"
      : process.env.KEYCLOAK_ROLE_CUSTOMER || "KHACH_HANG";
  if (!roles.some((role) => role.name === expectedRole)) return null;

  if (!linkedId) {
    if (type === "admin") {
      await NhanVien.UPDATE_KEYCLOAK(user.NV_ID, account.id);
    } else {
      await KhachHang.UPDATE_KEYCLOAK(user.KH_ID, account.id);
    }
  }
  return account.id;
}

function renderPage(req, res, type, view, title) {
  res.render(view, {
    pageTitle: title,
    isAdmin: type === "admin",
    errorMessage: req.flash("error")[0] || "",
    successMessage: req.flash("success")[0] || "",
  });
}

module.exports.forgotPage = (req, res, type) =>
  renderPage(
    req,
    res,
    type,
    "client/pages/auth/forgotPassword",
    "Quên mật khẩu",
  );

module.exports.sendResetOtp = async (req, res, type) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const path = basePath(type);

  try {
    const user = await findAccount(type, email);
    const keycloakId = user ? await resolveKeycloakId(type, user) : null;

    if (keycloakId) {
      const code = await OTP.issue(email, purpose(type));
      try {
        await sendMail.sendOtp(email, code, "khôi phục mật khẩu");
      } catch (error) {
        await OTP.remove(email, purpose(type)).catch(() => {});
        throw error;
      }
      req.session.pendingPasswordReset = {
        type,
        email,
        keycloakId,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
    } else {
      req.session.pendingPasswordReset = null;
    }

    req.flash(
      "success",
      "Nếu email thuộc tài khoản đang hoạt động, mã khôi phục sẽ được gửi đến email đó.",
    );
    return res.redirect(path + "/reset-password");
  } catch (error) {
    if (
      error.message &&
      error.message.includes("đợi một phút") &&
      req.session.pendingPasswordReset &&
      req.session.pendingPasswordReset.email === email
    ) {
      return res.redirect(path + "/reset-password");
    }
    console.error("Lỗi gửi mã khôi phục:", error.message);
    req.flash("error", error.message || "Không thể gửi mã khôi phục.");
    return res.redirect(path + "/forgot-password");
  }
};

module.exports.resetPage = (req, res, type) =>
  renderPage(
    req,
    res,
    type,
    "client/pages/auth/resetPasswordOtp",
    "Đặt lại mật khẩu",
  );

module.exports.resetPassword = async (req, res, type) => {
  const pending = req.session.pendingPasswordReset;
  const path = basePath(type);
  const code = String(req.body.code || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!pending || pending.type !== type || pending.expiresAt <= Date.now()) {
    delete req.session.pendingPasswordReset;
    req.flash("error", "Phiên khôi phục đã hết hạn. Hãy yêu cầu mã mới.");
    return res.redirect(path + "/forgot-password");
  }
  if (password.length < 8 || password !== confirmPassword) {
    req.flash("error", "Mật khẩu mới cần ít nhất 8 ký tự và hai ô phải khớp.");
    return res.redirect(path + "/reset-password");
  }

  try {
    const verified = await OTP.verify(pending.email, purpose(type), code);
    if (!verified) {
      req.flash("error", "Mã OTP không đúng hoặc đã hết hạn.");
      return res.redirect(path + "/reset-password");
    }

    await keycloak.resetPassword(pending.keycloakId, password);
    await keycloak
      .logoutUserSessions(pending.keycloakId)
      .catch((error) =>
        console.error(
          "Không thể kết thúc các phiên Keycloak cũ:",
          error.message,
        ),
      );
    delete req.session.pendingPasswordReset;
    req.flash("success", "Đặt lại mật khẩu thành công. Hãy đăng nhập lại.");
    return res.redirect(path + "/signin");
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error.message);
    req.flash("error", "Không thể đặt lại mật khẩu. Hãy thử lại.");
    return res.redirect(path + "/reset-password");
  }
};
