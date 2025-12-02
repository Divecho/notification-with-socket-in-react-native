// server.js
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(express.json());
app.use(cors());

// In-memory stores
let notifications = [];
let orders = [];

// ✅ Dummy PhonePe Merchant Credentials (for local sandbox)
const MERCHANT_ID = "M232CTLAOBMEW";
const SALT_KEY = "099eb0cd-02cf-4e2a-ad21-3435e5df3b7e"; // sandbox salt
const SALT_INDEX = 1;

// ---------------------------------------------------------
// 📦 Create Payment Order (Simulates backend transaction)
// ---------------------------------------------------------
app.post("/create-order", (req, res) => {
  try {
    const { amount, userId, mobileNumber } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const merchantTransactionId = "T" + Date.now();

    // Payment payload (same as frontend)
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: userId || "U1001",
      amount: Number(amount) * 100, // paise
      callbackUrl: `http://localhost:${PORT}/phonepe/callback`,
      mobileNumber: mobileNumber || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Encode + generate checksum
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = crypto
      .createHash("sha256")
      .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
      .digest("hex");
    const xVerify = checksum + "###" + SALT_INDEX;

    // ✅ Save order locally
    orders.push({ merchantTransactionId, status: "CREATED", amount });

    // Instead of hitting real PhonePe API, simulate response
    const fakePhonePeUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay`;
    console.log("📤 Simulated order created:", merchantTransactionId);

    res.json({
      success: true,
      message: "Dummy order created successfully",
      merchantTransactionId,
      redirectUrl: fakePhonePeUrl, // for testing
      xVerify,
      payloadBase64,
    });
  } catch (err) {
    console.error("❌ Order creation error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------
// 🪙 Simulated callback endpoint
// ---------------------------------------------------------
app.post("/phonepe/callback", (req, res) => {
  const { merchantTransactionId, status } = req.body;
  console.log("📞 Callback received:", req.body);

  const order = orders.find(o => o.merchantTransactionId === merchantTransactionId);
  if (order) {
    order.status = status || "SUCCESS";
  }

  res.status(200).json({ success: true, message: "Callback handled" });
});

// ---------------------------------------------------------
// 🔔 Notifications
// ---------------------------------------------------------
app.post("/notifications", (req, res) => {
  const { title, message, userId, type } = req.body;
  const newNotification = { title, message, userId, type, id: Date.now() };
  notifications.push(newNotification);
  console.log("📬 Dummy Notification Received:", newNotification);
  res.status(200).json({ success: true, message: "Notification received successfully" });
});

app.get("/notifications", (req, res) => {
  const since = parseInt(req.query.since || 0, 10);
  const newNotifications = notifications.filter(n => n.id > since);
  res.json(newNotifications);
});

// ---------------------------------------------------------
// 🚀 Start server
// ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Local backend running at http://localhost:${PORT}`);
  console.log("✅ Ready for PhonePe frontend testing");
});
