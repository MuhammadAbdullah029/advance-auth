const express = require('express');
const { verifyEmail, register, forgotPassword, resetPassword, login, verifyOTP } = require('../controllers/auth.controller');

const router = express.Router();

// ---------- FRONTEND EJS ROUTES ----------
router.get("/register", (req, res) => res.render("register"));
router.get("/login", (req, res) => res.render("login"));
router.get("/verify-otp", (req, res) => res.render("verify-otp"));
router.get("/forgot", (req, res) => res.render("forgot"));
router.get("/reset/:token", (req, res) => res.render("reset", { token: req.params.token }));
router.get("/verify/:token", (req, res) => res.render("verify", { token: req.params.token }));

// ---------- BACKEND API ROUTES ----------
router.post('/register', register);
router.post('/login', login);
router.post("/verify-otp", verifyOTP);
router.get("/verify/:token/confirm", verifyEmail);   
router.post("/forgot-password", forgotPassword);
router.post("/reset/:token", resetPassword);        
module.exports = router;
