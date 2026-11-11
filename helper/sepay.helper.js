const crypto = require("crypto");

const SIGNED_FIELDS = [
  "order_amount",
  "merchant",
  "currency",
  "operation",
  "order_description",
  "order_invoice_number",
  "customer_id",
  "payment_method",
  "success_url",
  "error_url",
  "cancel_url",
];

module.exports.createCheckoutFields = ({
  amount,
  invoice,
  description,
  customerId,
}) => {
  const merchant = process.env.SEPAY_MERCHANT_ID;
  const secret = process.env.SEPAY_SECRET_KEY;
  const baseUrl = String(process.env.APP_BASE_URL || "").replace(/\/+$/, "");

  if (!merchant || !secret || !baseUrl) {
    throw new Error("Thiếu cấu hình SePay trong file .env.");
  }

  const parsedUrl = new URL(baseUrl);
  if (
    parsedUrl.protocol !== "https:" ||
    /localhost|127\.0\.0\.1/i.test(parsedUrl.hostname)
  ) {
    throw new Error("APP_BASE_URL phải là địa chỉ HTTPS công khai.");
  }

  const fields = {
    order_amount: String(Math.round(Number(amount))),
    merchant,
    currency: "VND",
    operation: "PURCHASE",
    order_description: String(description).slice(0, 200),
    order_invoice_number: String(invoice),
    customer_id: String(customerId),
    success_url: `${baseUrl}/booking/payment/result?result=success`,
    error_url: `${baseUrl}/booking/payment/result?result=error`,
    cancel_url: `${baseUrl}/booking/payment/result?result=cancel`,
    lang: "vi",
  };

  const signedString = SIGNED_FIELDS.filter(
    (field) => fields[field] && fields[field] !== "0",
  )
    .map((field) => `${field}=${fields[field]}`)
    .join(",");

  fields.signature = crypto
    .createHmac("sha256", secret)
    .update(signedString)
    .digest("base64");

  return fields;
};
