const crypto = require("crypto");
const OTP = require("../models/OTP.model");

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function getSecret() {
  const secret = process.env.OTP_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error("Thiếu OTP_SECRET hoặc SESSION_SECRET");
  return secret;
}

function hashCode(email, purpose, code) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(email + "|" + purpose + "|" + code)
    .digest("hex");
}

module.exports.issue = async (email, purpose) => {
  const now = new Date();
  const previous = await OTP.findOne({
    email,
    purpose,
    expiresAt: { $gt: now },
  });

  if (
    previous &&
    now.getTime() - previous.createdAt.getTime() < OTP_RESEND_WAIT_MS
  ) {
    throw new Error("Vui lòng đợi một phút trước khi yêu cầu mã mới.");
  }

  await OTP.deleteMany({ email, purpose });

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  await OTP.create({
    email,
    purpose,
    codeHash: hashCode(email, purpose, code),
    createdAt: now,
    expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
    attempts: 0,
  });

  return code;
};

module.exports.verify = async (email, purpose, code) => {
  const now = new Date();
  const record = await OTP.findOne({
    email,
    purpose,
    expiresAt: { $gt: now },
  });

  if (!record || record.attempts >= MAX_ATTEMPTS) {
    if (record) await OTP.deleteOne({ _id: record._id });
    return false;
  }

  const submittedHash = Buffer.from(hashCode(email, purpose, String(code)));
  const savedHash = Buffer.from(record.codeHash);
  const matches =
    submittedHash.length === savedHash.length &&
    crypto.timingSafeEqual(submittedHash, savedHash);

  if (!matches) {
    await OTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return false;
  }

  await OTP.deleteOne({ _id: record._id });
  return true;
};

module.exports.remove = (email, purpose) => OTP.deleteMany({ email, purpose });
