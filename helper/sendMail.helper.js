const nodemailer = require("nodemailer");

module.exports.sendOtp = async (email, code, purposeText) => {
  const user = process.env.MAIL_USER;
  const password = process.env.MAIL_APP_PASSWORD;

  if (!user || !password) {
    throw new Error("Thiếu MAIL_USER hoặc MAIL_APP_PASSWORD trong file .env");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || user,
    to: email,
    subject: "Mã xác thực PetCare",
    text:
      "Mã xác thực " +
      purposeText +
      " của bạn là " +
      code +
      ". Mã hết hạn sau 5 phút.",
    html:
      "<p>Mã xác thực " +
      purposeText +
      ' của bạn là:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">' +
      code +
      "</p><p>Mã hết hạn sau 5 phút.</p>",
  });
};
