import express from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import crypto from 'crypto';

const router = express.Router();

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 3;

// Temporary in-memory store (Replace with Redis for production)
const otpStore = new Map();

// --- EMAIL CONFIG (Nodemailer) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- SMS CONFIG (Twilio) ---
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// --- RATE LIMITING ---
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  message: { error: 'Too many OTP requests. Please try again later.' },
});

// --- ROUTES ---

/**
 * Request OTP
 * POST /api/auth/request-otp
 */
router.post('/request-otp', otpRequestLimiter, async (req, res) => {
  const { identifier } = req.body; // email or phone
  if (!identifier) return res.status(400).json({ error: 'Email or phone is required' });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP with attempts tracking
  otpStore.set(identifier, { otp, expiresAt, attempts: 0 });

  try {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      // Send via Email
      if (process.env.EMAIL_USER) {
        await transporter.sendMail({
          from: `"Daksh-Bharat Auth" <${process.env.EMAIL_USER}>`,
          to: identifier,
          subject: "Your Secure Login OTP",
          text: `Your 6-digit OTP is ${otp}. It expires in 5 minutes.`,
        });
      } else {
        console.log(`[DEV MODE] Email OTP for ${identifier}: ${otp}`);
      }
    } else {
      // Send via SMS
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        await twilioClient.messages.create({
          body: `Your Daksh-Bharat verification code is ${otp}. Expires in 5 mins.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: identifier.startsWith('+') ? identifier : `+91${identifier}`,
        });
      } else {
        console.log(`[DEV MODE] SMS OTP for ${identifier}: ${otp}`);
      }
    }

    res.json({ success: true, message: 'OTP sent successfully', demo_otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to deliver OTP. Please check configuration.' });
  }
});

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  
  if (!identifier || !otp) {
    return res.status(400).json({ error: 'Identifier and OTP are required' });
  }

  const storedData = otpStore.get(identifier);

  if (!storedData) {
    return res.status(404).json({ error: 'No OTP requested for this identifier' });
  }

  // Check Expiry
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return res.status(410).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // Check Max Attempts
  if (storedData.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(identifier);
    return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
  }

  // Verify OTP
  if (storedData.otp !== otp) {
    storedData.attempts += 1;
    otpStore.set(identifier, storedData);
    return res.status(401).json({ 
      error: 'Invalid OTP', 
      remainingAttempts: MAX_VERIFY_ATTEMPTS - storedData.attempts 
    });
  }

  // Success! Create JWT
  const token = jwt.sign(
    { sub: identifier, role: 'user' }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );

  // Clear OTP
  otpStore.delete(identifier);

  res.json({ 
    success: true, 
    token, 
    user: { identifier } 
  });
});

export default router;
