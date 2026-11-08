const KhachHang = require("../../models/KHACH_HANG.model");
const keycloak = require("../../server/keycloak.server");
const otpHelper = require("../../helper/otp.helper");
const sendMail = require("../../helper/sendMail.helper");
const authSession = require("../../helper/authSession.helper");

const CUSTOMER_ROLE = process.env.KEYCLOAK_ROLE_CUSTOMER || "KHACH_HANG";

function cleanEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showAuthPage(res, view, pageTitle, req) {
  res.render(view, {
    pageTitle,
    errorMessage: req.flash("error")[0] || "",
    successMessage: req.flash("success")[0] || "",
  });
}

module.exports.signin = (req, res) =>
  showAuthPage(res, "client/pages/auth/signin", "Đăng nhập tài khoản", req);

module.exports.signinPost = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  let refreshToken = "";

  try {
    const user = await KhachHang.SELECT_KH("KH_EMAIL", email);
    if (!user || user.KH_TRANGTHAI !== "active") {
      req.flash(
        "error",
        "Email hoặc mật khẩu không đúng, hoặc tài khoản đã khóa.",
      );
      return res.redirect("/auth/signin");
    }

    const tokens = await keycloak.login(email, password);
    refreshToken = tokens.refresh_token;
    const tokenInfo = await keycloak.statusToken(tokens.access_token);
    if (!tokenInfo.active || !tokenInfo.sub) {
      throw new Error("Keycloak không xác thực được tài khoản");
    }

    if (user.KH_KEYCLOAK && user.KH_KEYCLOAK !== tokenInfo.sub) {
      throw new Error("Tài khoản PetCare không khớp tài khoản Keycloak");
    }

    const roles = await keycloak.getRealmRoles(tokenInfo.sub);
    if (!roles.some((role) => role.name === CUSTOMER_ROLE)) {
      await keycloak.logout(tokens.refresh_token).catch(() => {});
      req.flash("error", "Tài khoản này chưa được gán vai trò khách hàng.");
      return res.redirect("/auth/signin");
    }

    if (!user.KH_KEYCLOAK) {
      await KhachHang.UPDATE_KEYCLOAK(user.KH_ID, tokenInfo.sub);
    }

    await authSession.start(req, {
      auth: {
        type: "customer",
        userId: user.KH_ID,
        keycloakId: tokenInfo.sub,
        fullName: user.KH_HOTEN,
        email: user.KH_EMAIL,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    req.flash("success", "Đăng nhập thành công.");
    return res.redirect("/");
  } catch (error) {
    if (refreshToken) await keycloak.logout(refreshToken).catch(() => {});
    console.error("Lỗi đăng nhập khách hàng:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      keycloakError: error.response?.data,
    });
    req.flash("error", "Email hoặc mật khẩu không đúng.");
    return res.redirect("/auth/signin");
  }
};

module.exports.signup = (req, res) =>
  showAuthPage(res, "client/pages/auth/signup", "Đăng ký tài khoản", req);

module.exports.signupPost = async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");
  const phone = String(req.body.sdt || "").trim();

  if (!fullName || fullName.length > 255 || !validEmail(email)) {
    req.flash("error", "Vui lòng nhập họ tên và email hợp lệ.");
    return res.redirect("/auth/signup");
  }
  if (password.length < 8) {
    req.flash("error", "Mật khẩu cần có ít nhất 8 ký tự.");
    return res.redirect("/auth/signup");
  }
  if (password !== confirmPassword) {
    req.flash("error", "Mật khẩu nhập lại chưa khớp.");
    return res.redirect("/auth/signup");
  }

  let otpIssued = false;
  try {
    if (await KhachHang.SELECT_KH("KH_EMAIL", email)) {
      req.flash("error", "Email đã được đăng ký.");
      return res.redirect("/auth/signup");
    }
    if (phone && (await KhachHang.SELECT_KH("KH_SDT", phone))) {
      req.flash("error", "Số điện thoại đã được sử dụng.");
      return res.redirect("/auth/signup");
    }
    if ((await keycloak.checkUsername(email)).length > 0) {
      req.flash(
        "error",
        "Email đã có tài khoản. Hãy đăng nhập hoặc khôi phục mật khẩu.",
      );
      return res.redirect("/auth/signin");
    }

    const code = await otpHelper.issue(email, "signup");
    otpIssued = true;
    await sendMail.sendOtp(email, code, "đăng ký tài khoản");

    req.session.pendingSignup = {
      fullName,
      email,
      password,
      phone,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    return res.redirect("/auth/otp");
  } catch (error) {
    if (otpIssued) await otpHelper.remove(email, "signup").catch(() => {});
    if (
      error.message &&
      error.message.includes("đợi một phút") &&
      req.session.pendingSignup &&
      req.session.pendingSignup.email === email
    ) {
      return res.redirect("/auth/otp");
    }
    console.error("Lỗi gửi OTP đăng ký:", error.message);
    req.flash("error", error.message || "Không thể gửi mã xác thực.");
    return res.redirect("/auth/signup");
  }
};

module.exports.otp = (req, res) => {
  const pending = req.session.pendingSignup;
  if (!pending || pending.expiresAt <= Date.now()) {
    delete req.session.pendingSignup;
    req.flash("error", "Phiên đăng ký đã hết hạn. Hãy đăng ký lại.");
    return res.redirect("/auth/signup");
  }

  res.render("client/pages/auth/otp", {
    pageTitle: "Xác thực email",
    email: pending.email,
    errorMessage: req.flash("error")[0] || "",
  });
};

module.exports.signupVerify = async (req, res) => {
  const pending = req.session.pendingSignup;
  const code = String(req.body.code || "").trim();

  if (!pending || pending.expiresAt <= Date.now()) {
    delete req.session.pendingSignup;
    req.flash("error", "Phiên đăng ký đã hết hạn. Hãy đăng ký lại.");
    return res.redirect("/auth/signup");
  }

  try {
    const verified = await otpHelper.verify(pending.email, "signup", code);
    if (!verified) {
      req.flash("error", "Mã OTP không đúng hoặc đã hết hạn.");
      return res.redirect("/auth/otp");
    }

    if (await KhachHang.SELECT_KH("KH_EMAIL", pending.email)) {
      delete req.session.pendingSignup;
      req.flash("error", "Email đã được đăng ký.");
      return res.redirect("/auth/signin");
    }

    const keycloakId = await keycloak.createUser(
      {
        name: pending.fullName,
        email: pending.email,
        password: pending.password,
      },
      CUSTOMER_ROLE,
    );

    let result;
    try {
      const today = new Date().toISOString().slice(0, 10);
      result = await KhachHang.INSERT({
        KH_HOTEN: pending.fullName,
        KH_EMAIL: pending.email,
        KH_KEYCLOAK: keycloakId,
        KH_SDT: pending.phone || null,
        KH_CCCD: null,
        KH_NGAYTAO: today,
      });
    } catch (error) {
      await keycloak.deleteUser(keycloakId).catch(() => {});
      throw error;
    }

    delete req.session.pendingSignup;
    try {
      const tokens = await keycloak.login(pending.email, pending.password);
      const tokenInfo = await keycloak.statusToken(tokens.access_token);
      if (!tokenInfo.active || tokenInfo.sub !== keycloakId) {
        throw new Error("Keycloak không xác thực được tài khoản mới");
      }
      await authSession.start(req, {
        auth: {
          type: "customer",
          userId: result.insertId,
          keycloakId,
          fullName: pending.fullName,
          email: pending.email,
        },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      });
    } catch (error) {
      console.error("Tài khoản đã tạo nhưng chưa tự đăng nhập được:", {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        keycloakError: error.response?.data,
      });
      req.flash(
        "success",
        "Tạo tài khoản thành công. Hãy đăng nhập để tiếp tục.",
      );
      return res.redirect("/auth/signin");
    }

    req.flash("success", "Tạo tài khoản thành công.");
    return res.redirect("/");
  } catch (error) {
    console.error("Lỗi hoàn tất đăng ký:", error.message);
    req.flash("error", "Không thể tạo tài khoản. Hãy thử lại.");
    return res.redirect("/auth/signup");
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
    res.redirect("/auth/signin");
  });
};
