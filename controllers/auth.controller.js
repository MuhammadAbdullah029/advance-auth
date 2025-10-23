const User = require('../models/user.model');
const sendEmail = require('../utils/email.send');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");


exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const user = await User.create({ name, email, password });

        const verifyToken = user.genToken();
        const verifyUrl = `${process.env.CLIENT_URL}/verify/${verifyToken}/confirm`;

        await sendEmail({
            to: email,
            subject: "Verify your account",
            text: `Click to verify your email: ${verifyUrl}`
        });

        res.status(201).json({ message: "User registered, check email to verify." });

    } catch (error) {
        console.error('Error in Register Route: ', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  if (!user.isVerified) return res.status(401).json({ error: "Please verify your email first." });

  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 mins expiry
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your Login OTP 🔐",
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  });

  res.redirect('/verify-otp');
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ error: "Invalid token" });

    user.isVerified = true;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    res.status(400).json({ error: "Token invalid or expired" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    otp,
    otpExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  const token = user.genToken();
  res.json({ message: "Login successful", token });
};


exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset",
    text: `Reset your password: ${resetUrl}`
  });

  res.json({ message: "Password reset link sent to email." });
};


exports.resetPassword = async (req, res) => {
  const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ error: "Token invalid or expired" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successful!" });
};
