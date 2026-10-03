import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure public upload directories exist and serve statically
const uploadsDir = path.resolve(__dirname, 'public/uploads/payments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.resolve(__dirname, 'public/uploads')));

// Initialize GoogleGenAI SDK (automatically uses process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();

// Verified fallback coordinates for prominent Janakpurdham Chowks & Landmarks
const JANAKPUR_CHOWK_COORDINATES: Record<string, { lat: number; lng: number; description: string; landmarks: string[] }> = {
  'bhanu-chowk': {
    lat: 26.7271,
    lng: 85.9250,
    description: 'Central commercial heart of Janakpurdham, near the iconic clock tower and main bazaar.',
    landmarks: ['Bhanu Chowk Clock Tower', 'Main Market', 'Old Post Office Road']
  },
  'shiva-chowk': {
    lat: 26.7280,
    lng: 85.9230,
    description: 'Bustling central junction close to Shiva temple, major commercial banks, and stationery shops.',
    landmarks: ['Shiva Mandir', 'Commercial Bank Row', 'Janakpur Municipal Road']
  },
  'ramanand-chowk': {
    lat: 26.7335,
    lng: 85.9220,
    description: 'North-central Janakpur hub on Hospital Road, famous for educational institutes and coaching centers.',
    landmarks: ['Hospital Road Hub', 'Ramanand Gate', 'Janakpur Eye Hospital']
  },
  'murali-chowk': {
    lat: 26.7220,
    lng: 85.9180,
    description: 'Student-centric residential and campus area near Ramshwaroop Ramsagar (R.R.) Multiple Campus.',
    landmarks: ['R.R. Multiple Campus', 'Murali Pond', 'Tribhuvan University Wing']
  },
  'janaki-mandir-area': {
    lat: 26.7303,
    lng: 85.9264,
    description: 'Historic cultural sanctuary surrounding the magnificent Janaki Mandir and Vivah Mandap.',
    landmarks: ['Janaki Temple (Nau Lakha)', 'Vivah Mandap', 'Dhanush Sagar']
  },
  'pidari-chowk': {
    lat: 26.7450,
    lng: 85.9280,
    description: 'Northern gateway connecting Janakpur city center to the East-West Highway bypass.',
    landmarks: ['Bypass Junction', 'Trade Outlets', 'Pidari Transport Terminal']
  },
  'zero-mile': {
    lat: 26.7550,
    lng: 85.9350,
    description: 'Major transit entry point leading towards Dhalkebar and Mahendra Highway.',
    landmarks: ['Dhalkebar Highway Entry', 'Highway Petrol Stations', 'Northern Ring']
  },
  'mills-area': {
    lat: 26.7250,
    lng: 85.9320,
    description: 'Historic railway and industrial precinct located near Janakpurdham Railway Station.',
    landmarks: ['Janakpurdham Railway Station', 'Old Mills Grounds', 'Station Bazaar']
  },
  'hospital-road': {
    lat: 26.7310,
    lng: 85.9215,
    description: 'Medical and healthcare corridor leading to the Provincial Hospital Janakpur.',
    landmarks: ['Janakpur Provincial Hospital', 'Pharmacies Lane', 'Janaki Medical College Outpost']
  },
  'provincial-hospital-road': {
    lat: 26.7310,
    lng: 85.9215,
    description: 'Medical and healthcare corridor leading to the Provincial Hospital Janakpur.',
    landmarks: ['Janakpur Provincial Hospital', 'Specialist Clinics', 'Nursing Institutes']
  },
  'tinkauria-chowk': {
    lat: 26.7380,
    lng: 85.9310,
    description: 'Commercial 3-way junction linking residential neighborhoods with southern arterial roads.',
    landmarks: ['Commercial Markets', 'Auto Stands', 'South Route Hub']
  },
  'loharpa-chowk': {
    lat: 26.7180,
    lng: 85.9150,
    description: 'Quiet south-western residential district with open green spaces and peaceful family neighborhoods.',
    landmarks: ['Loharpa Residential Area', 'Community Grounds', 'Ring Road Connect']
  }
};

function getFallbackCoordinates(chowkName: string) {
  const normalized = chowkName.toLowerCase().trim().replace(/\s+/g, '-');
  for (const [key, data] of Object.entries(JANAKPUR_CHOWK_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        lat: data.lat,
        lng: data.lng,
        chowk: chowkName,
        locationDescription: data.description,
        confidence: 'high' as const,
        nearbyLandmarks: data.landmarks,
        source: 'cached_directory'
      };
    }
  }

  // Generic Janakpur city center default
  return {
    lat: 26.7288,
    lng: 85.9244,
    chowk: chowkName,
    locationDescription: `Centrally positioned in Janakpurdham around ${chowkName}.`,
    confidence: 'estimated' as const,
    nearbyLandmarks: ['Janakpur City Center', 'Janaki Mandir Area', 'Bhanu Chowk'],
    source: 'city_center_default'
  };
}

// POST /api/suggest-coordinates
// Accepts { chowk: string, wardNumber?: string, addressLine?: string, landmark?: string }
// Queries Gemini 3.8 Flash to suggest precise geographic coordinates in Janakpur, Nepal
app.post('/api/suggest-coordinates', async (req: Request, res: Response) => {
  const { chowk, wardNumber, addressLine, landmark } = req.body || {};

  if (!chowk || typeof chowk !== 'string' || !chowk.trim()) {
    res.status(400).json({ error: 'Chowk name is required.' });
    return;
  }

  const cleanChowk = chowk.trim();
  const cleanWard = typeof wardNumber === 'string' ? wardNumber.trim() : '';
  const cleanAddress = typeof addressLine === 'string' ? addressLine.trim() : '';
  const cleanLandmark = typeof landmark === 'string' ? landmark.trim() : '';

  // 1. Check if we have an instant high-confidence match in our verified Janakpur Chowk directory
  // If no detailed custom address/landmark is provided, return instant verified coordinates
  const isCustomQuery = Boolean(cleanAddress || cleanLandmark);
  const matchedCoords = getFallbackCoordinates(cleanChowk);
  if (!isCustomQuery && matchedCoords.source === 'cached_directory') {
    res.json(matchedCoords);
    return;
  }

  try {
    const prompt = `You are a specialized geographic information assistant for Janakpurdham (Janakpur), Dhanusha District, Madhesh Province, Nepal.
Determine the most accurate geographic latitude and longitude coordinates for the specified chowk / location in Janakpurdham.

Location Details:
- Chowk / Neighborhood: ${cleanChowk}
- Ward Number: ${cleanWard || 'Not specified'}
- Address Line: ${cleanAddress || 'Not specified'}
- Landmark: ${cleanLandmark || 'Not specified'}

Key Geographic Bounds for Janakpurdham city:
- Latitude strictly between 26.6800 and 26.7800 (Janakpur center is ~26.7288)
- Longitude strictly between 85.8800 and 85.9800 (Janakpur center is ~85.9244)

Provide accurate coordinates, a concise 1-2 sentence description of the location in Janakpur, confidence level (high, medium, estimated), and 2-3 prominent nearby landmarks.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 12 seconds')), 12000)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: {
              type: Type.NUMBER,
              description: 'Latitude coordinate in Janakpur, Nepal (approx 26.70 to 26.76)'
            },
            lng: {
              type: Type.NUMBER,
              description: 'Longitude coordinate in Janakpur, Nepal (approx 85.90 to 85.95)'
            },
            chowk: {
              type: Type.STRING,
              description: 'The standard chowk name'
            },
            locationDescription: {
              type: Type.STRING,
              description: 'Brief description of the chowk location in Janakpur'
            },
            confidence: {
              type: Type.STRING,
              enum: ['high', 'medium', 'estimated']
            },
            nearbyLandmarks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 landmarks near this chowk in Janakpur'
            }
          },
          required: ['lat', 'lng', 'chowk', 'locationDescription']
        }
      }
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);

    // Verify coordinates fall within realistic Janakpur vicinity bounds
    const lat = Number(parsed.lat);
    const lng = Number(parsed.lng);

    const isValidJanakpur =
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= 26.60 &&
      lat <= 26.85 &&
      lng >= 85.80 &&
      lng <= 86.05;

    if (!isValidJanakpur) {
      console.warn('Coordinates outside Janakpur bounds, falling back to verified location.');
      res.json(matchedCoords);
      return;
    }

    res.json({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      chowk: parsed.chowk || cleanChowk,
      locationDescription: parsed.locationDescription,
      confidence: parsed.confidence || 'high',
      nearbyLandmarks: Array.isArray(parsed.nearbyLandmarks) ? parsed.nearbyLandmarks : [],
      source: 'gemini_api'
    });
  } catch (err: any) {
    // Graceful fallback to verified Janakpur chowk coordinates without unhandled console error
    console.warn('Coordinates suggestion fallback used:', err?.message || 'Gemini unavailable');
    res.json(matchedCoords);
  }
});

// POST /api/upload-payment-image
// Accepts base64 encoded image data and saves to public/uploads/payments/{qrs|receipts}
app.post('/api/upload-payment-image', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, base64Data, folder } = req.body || {};
    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'Base64 image data is required.' });
      return;
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds 5 MB limit.' });
      return;
    }

    const subfolder = folder === 'receipts' ? 'receipts' : 'qrs';
    const targetDir = path.resolve(__dirname, 'public/uploads/payments', subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = (fileName && typeof fileName === 'string' && fileName.includes('.'))
      ? fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
      : 'png';

    const safeName = `${subfolder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.resolve(targetDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/payments/${subfolder}/${safeName}`;
    res.json({
      success: true,
      url: relativeUrl,
      fileName: safeName
    });
  } catch (err: any) {
    console.error('Failed to save payment image on server:', err);
    res.status(500).json({ error: err?.message || 'Failed to save image on server.' });
  }
});

// ==========================================
// RoomSewa Secure Account & Authentication Service
// ==========================================
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const accountsFilePath = path.resolve(dataDir, 'roomsewa_accounts.json');

interface StoredAccount {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: 'seeker' | 'owner' | 'admin';
  isPremium: boolean;
  salt: string;
  passwordHash: string;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationExpires?: string | null;
  lastVerificationSentAt?: string | null;
  resetToken?: string | null;
  resetExpires?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_EMAILS_LIST = [
  'rajritesh1618@gmail.com',
  'admin@roomsewa.com',
  'admin@janakpurrooms.com'
];

function isSuperAdminEmailServer(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS_LIST.includes(email.toLowerCase().trim());
}

function isValidGmailServer(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  return /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@gmail\.com$/i.test(trimmed);
}

const GMAIL_VALIDATION_ERROR = 'Please enter a valid Gmail address (example@gmail.com).';

function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function loadAccounts(): StoredAccount[] {
  try {
    if (fs.existsSync(accountsFilePath)) {
      const content = fs.readFileSync(accountsFilePath, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.warn('Could not read roomsewa_accounts.json, initializing empty list:', err);
  }
  return [];
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save roomsewa_accounts.json:', err);
  }
}

function hashPasswordWithSalt(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

function generateSecureToken(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(20).toString('hex')}`;
}

// POST /api/auth/signup
// Handles First-Time RoomSewa user registration
// Account is created as UNVERIFIED, user is NOT logged in, and real verification email is delivered to their Gmail
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone } = req.body || {};

    // 1. Gmail format validation
    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Password validation (min 6 characters)
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password should be at least 6 characters long.' });
      return;
    }

    // 3. Name validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }

    const accounts = loadAccounts();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    // If an already verified account exists, block signup
    if (existingIndex >= 0 && accounts[existingIndex].isVerified) {
      res.status(400).json({
        error: 'An account with this Gmail address already exists. Please sign in or use Forgot Password.'
      });
      return;
    }

    // Rate-limit rapid duplicate signups (60-second cooldown)
    const now = Date.now();
    if (existingIndex >= 0 && accounts[existingIndex].lastVerificationSentAt) {
      const elapsedMs = now - new Date(accounts[existingIndex].lastVerificationSentAt!).getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          error: `Verification email was already sent recently. Resend available in ${remainingSeconds}s. Please check your Inbox and don't forget to check your Spam/Junk folder.`,
          remainingSeconds
        });
        return;
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPasswordWithSalt(password, salt);
    const verificationToken = generateSecureToken('verify');
    const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours
    const isSuper = isSuperAdminEmailServer(cleanEmail);
    const assignedRole = isSuper ? 'admin' : (role === 'owner' ? 'owner' : 'seeker');

    let accountRecord: StoredAccount;

    if (existingIndex >= 0) {
      // Update unverified account with new credentials and fresh token
      accountRecord = {
        ...accounts[existingIndex],
        displayName: name.trim(),
        phoneNumber: phone ? String(phone).trim() : accounts[existingIndex].phoneNumber,
        role: assignedRole,
        isPremium: isSuper || accounts[existingIndex].isPremium,
        salt,
        passwordHash,
        isVerified: false,
        verificationToken,
        verificationExpires,
        updatedAt: new Date().toISOString()
      };
      accounts[existingIndex] = accountRecord;
    } else {
      // Create new account
      accountRecord = {
        uid: 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
        email: cleanEmail,
        displayName: name.trim(),
        phoneNumber: phone ? String(phone).trim() : '',
        role: assignedRole,
        isPremium: isSuper,
        salt,
        passwordHash,
        isVerified: false,
        verificationToken,
        verificationExpires,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      accounts.push(accountRecord);
    }

    // Build standard RoomSewa verification link using resolved base URL
    const baseUrl = getAppBaseUrl(req);
    const verificationLink = `${baseUrl}/?action=verify-email&token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`[RoomSewa Auth] Delivering verification email to ${cleanEmail}...`);

    try {
      await sendVerificationEmail({
        to: cleanEmail,
        name: name.trim(),
        verificationLink
      });
      accountRecord.lastVerificationSentAt = new Date().toISOString();
      saveAccounts(accounts);
    } catch (emailErr: any) {
      console.error(`[RoomSewa Auth] Error delivering email to ${cleanEmail}:`, emailErr);
      res.status(500).json({
        error: `Could not send verification email to ${cleanEmail}: ${emailErr?.message || 'Email delivery failed'}. Please check your Gmail address and try again.`
      });
      return;
    }

    // Return success without logging the user in, with the exact required notice
    res.json({
      success: true,
      message: "Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.",
      email: cleanEmail,
      remainingSeconds: 60
    });
  } catch (err: any) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Registration could not be completed. Please try again.' });
  }
});

// POST /api/auth/verify-email
// Verifies user account after they click the verification link from their Gmail
app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  try {
    const { token, email } = req.body || {};

    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Missing or invalid verification token.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      res.status(404).json({ error: 'No RoomSewa account found for this email.' });
      return;
    }

    if (account.isVerified) {
      res.json({
        success: true,
        alreadyVerified: true,
        message: 'Your RoomSewa account is already verified! You can log in using your Gmail and password.',
        email: cleanEmail
      });
      return;
    }

    if (account.verificationToken !== token) {
      res.status(400).json({ error: 'Invalid or expired verification token. Please request a new verification link.' });
      return;
    }

    if (account.verificationExpires && new Date(account.verificationExpires) < new Date()) {
      res.status(400).json({ error: 'This verification link has expired. Please request a new verification link.' });
      return;
    }

    // Activate account
    account.isVerified = true;
    account.verificationToken = null;
    account.verificationExpires = null;
    account.updatedAt = new Date().toISOString();

    saveAccounts(accounts);

    res.json({
      success: true,
      message: 'Your RoomSewa account has been successfully verified! You can now log in using your Gmail and password.',
      email: cleanEmail
    });
  } catch (err: any) {
    console.error('Error verifying email:', err);
    res.status(500).json({ error: 'Could not verify email. Please try again.' });
  }
});

// POST /api/auth/login
// Logs in user only if account is verified and credentials match
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    // 1. Gmail validation
    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Please enter your password.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    // If account doesn't exist, prompt them to Sign Up
    if (!account) {
      res.status(404).json({
        error: 'No RoomSewa account found with this Gmail. New users must create an account through Sign Up, not Login.'
      });
      return;
    }

    // If account is unverified, reject login with clear instruction
    if (!account.isVerified) {
      res.status(403).json({
        error: 'Your account is not verified yet. Please check your Gmail and click the verification link sent by RoomSewa before logging in.',
        unverified: true,
        email: cleanEmail
      });
      return;
    }

    // Verify password
    const expectedHash = hashPasswordWithSalt(password, account.salt);
    if (expectedHash !== account.passwordHash) {
      res.status(401).json({
        error: 'Invalid password. Please check your credentials or click "Forgot Password?" below.'
      });
      return;
    }

    const isSuper = isSuperAdminEmailServer(cleanEmail);
    const effectiveRole = isSuper ? 'admin' : account.role;

    res.json({
      success: true,
      user: {
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        phoneNumber: account.phoneNumber,
        role: effectiveRole,
        isPremium: isSuper || Boolean(account.isPremium),
        emailVerified: true
      }
    });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/forgot-password
// Sends password reset link to user's registered Gmail
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      res.status(404).json({
        error: 'No RoomSewa account found with this Gmail address. Please check your spelling or Sign Up.'
      });
      return;
    }

    // Generate secure reset token valid for 1 hour
    const resetToken = generateSecureToken('rst');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    account.resetToken = resetToken;
    account.resetExpires = resetExpires;
    account.updatedAt = new Date().toISOString();

    saveAccounts(accounts);

    const baseUrl = getAppBaseUrl(req);
    const resetLink = `${baseUrl}/?action=reset-password&token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`[RoomSewa Auth] Delivering password reset email to ${cleanEmail}...`);

    try {
      await sendPasswordResetEmail({
        to: cleanEmail,
        resetLink
      });
    } catch (emailErr: any) {
      console.error(`[RoomSewa Auth] Failed to deliver password reset email to ${cleanEmail}:`, emailErr);
      res.status(500).json({
        error: `Could not send password reset email: ${emailErr?.message || 'Email delivery error'}.`
      });
      return;
    }

    res.json({
      success: true,
      message: `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
      email: cleanEmail
    });
  } catch (err: any) {
    console.error('Error during forgot-password:', err);
    res.status(500).json({ error: 'Could not send reset link. Please try again.' });
  }
});

// POST /api/auth/reset-password
// Handles setting new password after clicking the reset link
// Requires new password and confirm password to match
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { email, token, newPassword, confirmPassword } = req.body || {};

    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid or missing password reset token.' });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Both passwords must match before allowing the password to be changed.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      res.status(404).json({ error: 'No RoomSewa account found for this email address.' });
      return;
    }

    if (account.resetToken !== token) {
      res.status(400).json({ error: 'Password reset link is invalid or has expired. Please request a new link.' });
      return;
    }

    if (account.resetExpires && new Date(account.resetExpires) < new Date()) {
      res.status(400).json({ error: 'Password reset link has expired. Please request a new link.' });
      return;
    }

    // Set new password
    const newSalt = crypto.randomBytes(16).toString('hex');
    account.salt = newSalt;
    account.passwordHash = hashPasswordWithSalt(newPassword, newSalt);
    account.resetToken = null;
    account.resetExpires = null;
    account.updatedAt = new Date().toISOString();

    saveAccounts(accounts);

    res.json({
      success: true,
      message: 'Your password has been changed successfully! You can now log in using your Gmail and new password.',
      email: cleanEmail
    });
  } catch (err: any) {
    console.error('Error during password reset:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// POST /api/auth/resend-verification
// Resends email verification link to Gmail, strictly enforcing 60-second cooldown
app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email || !isValidGmailServer(email)) {
      res.status(400).json({ error: GMAIL_VALIDATION_ERROR });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      res.status(404).json({ error: 'No RoomSewa account found with this Gmail. Please Sign Up first.' });
      return;
    }

    if (account.isVerified) {
      res.json({
        success: true,
        alreadyVerified: true,
        message: 'This account is already verified! You can log in directly.',
        email: cleanEmail
      });
      return;
    }

    // Enforce 60-second cooldown on resends
    const now = Date.now();
    if (account.lastVerificationSentAt) {
      const elapsedMs = now - new Date(account.lastVerificationSentAt).getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          error: `Resend available in ${remainingSeconds}s. Please check your Inbox and don't forget to check your Spam/Junk folder.`,
          remainingSeconds
        });
        return;
      }
    }

    const verificationToken = generateSecureToken('verify');
    account.verificationToken = verificationToken;
    account.verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const baseUrl = getAppBaseUrl(req);
    const verificationLink = `${baseUrl}/?action=verify-email&token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`[RoomSewa Auth] Delivering fresh verification email to ${cleanEmail}...`);

    try {
      await sendVerificationEmail({
        to: cleanEmail,
        name: account.displayName,
        verificationLink
      });
      account.lastVerificationSentAt = new Date().toISOString();
      account.updatedAt = new Date().toISOString();
      saveAccounts(accounts);
    } catch (emailErr: any) {
      console.error(`[RoomSewa Auth] Failed to resend verification email to ${cleanEmail}:`, emailErr);
      res.status(500).json({
        error: `Could not send verification email to ${cleanEmail}: ${emailErr?.message || 'SMTP error'}. Please check your Gmail address and try again.`
      });
      return;
    }

    res.json({
      success: true,
      message: "Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.",
      email: cleanEmail,
      remainingSeconds: 60
    });
  } catch (err: any) {
    console.error('Error resending verification email:', err);
    res.status(500).json({ error: 'Could not resend verification email.' });
  }
});

// Setup Vite middlewares in development or static file serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
