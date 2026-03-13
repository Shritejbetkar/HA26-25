import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { 
  initDb, getUsers, getUserById, getJobs, createUser, createJob, searchJobs,
  getApplicationsByWorker, getReviewsByWorker, createApplication, createReview,
  getApplicationsByEmployer, updateApplicationStatus, updateJobStatus
} from './db.js';
import OpenAI from 'openai';
import twilio from 'twilio';
import secureAuthRoutes from './secureAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Twilio (if keys exist)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Setup the Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies

// --- AUTH ROUTES ---
app.use('/api/auth', secureAuthRoutes);

// Initialize MySQL database
initDb();

// --- API ROUTES ---

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SQL backend is running' });
});

// Real-time SMS Route (via Twilio)
app.post('/api/send-sms', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: "Phone number and message are required" });
  }

  // Format number for Twilio (ensure it has +91 for India if not already present)
  let formattedNumber = to.replace(/\s+/g, '');
  if (!formattedNumber.startsWith('+')) {
    formattedNumber = `+91${formattedNumber}`;
  }

  console.log(`[SMS REQUEST] To: ${formattedNumber}, Msg: ${message}`);

  if (!twilioClient) {
    console.warn("Twilio not configured. Simulated SMS delivery successful.");
    return res.json({ 
      success: true, 
      simulated: true, 
      message: "Twilio credentials missing. SMS simulated locally." 
    });
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    res.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error("Twilio Error:", error.message);
    res.status(500).json({ error: "Failed to send SMS", details: error.message });
  }
});

// AI Search Route
app.post('/api/ai/search-jobs', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    let criteria = { title: null, trade: null, city: null };
    
    // 1. Try to use OpenAI to extract search criteria
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract job search criteria from the user's message. Return only a JSON object with keys: title (string), trade (string), city (string). If a field is not found, use null."
          },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      });
      criteria = JSON.parse(response.choices[0].message.content);
      criteria.is_fallback = false;
      console.log("Extracted search criteria (AI):", criteria);
    } catch (aiError) {
      console.error("AI extraction failed, falling back to basic search:", aiError.message);
      criteria.is_fallback = true;
      // Fallback: simple heuristic for criteria if AI fails (e.g. quota exceeded)
      const lowerMsg = message.toLowerCase();
      // Very basic extraction - if it's "electrician", treat it as trade/title
      const commonTrades = ['electrician', 'plumber', 'carpenter', 'mason', 'driver', 'painter'];
      for (const t of commonTrades) {
        if (lowerMsg.includes(t)) {
          criteria.trade = t;
          break;
        }
      }
      // If no trade found, use the whole message as a potential title keyword
      if (!criteria.trade) criteria.title = message;
    }

    // 2. Search database
    const jobs = await searchJobs(criteria);
    console.log(`Search complete. Found ${jobs.length} jobs.`);

    // 3. Return results
    res.json({ criteria, jobs, ai_active: !criteria.is_fallback });
  } catch (error) {
    console.error("CRITICAL AI Search Error:", error);
    res.status(500).json({ error: "Failed to process AI search" });
  }
});

// General AI Chat Route
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text || msg.text || ""
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Daksh-AI, the assistant for Daksh-Bharat, a rural labor exchange platform in India. You help workers build profiles and employers find verified talent. Be helpful, professional, and culturally aware of rural Indian contexts. Use simple language."
        },
        ...formattedHistory,
        { role: "user", content: message }
      ]
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("AI Chat Error:", error.message);
    
    // Fallback response for quota errors or other API issues
    if (error.code === 'insufficient_quota') {
      return res.json({ 
        text: "Namaste! I'm currently in a limited mode because my AI brain has reached its daily limit. However, I can still help you find jobs if you tell me what you're looking for! (e.g., 'Find electrician jobs')" 
      });
    }
    
    res.status(500).json({ error: "Failed to process AI chat" });
  }
});

// Users Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:uid', async (req, res) => {
  try {
    const user = await getUserById(req.params.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jobs Routes
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const result = await createJob(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Applications Routes
app.get('/api/applications/worker/:workerId', async (req, res) => {
  try {
    const apps = await getApplicationsByWorker(req.params.workerId);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/employer/:employerId', async (req, res) => {
  try {
    const apps = await getApplicationsByEmployer(req.params.employerId);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await updateApplicationStatus(req.params.id, status);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const result = await createApplication(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jobs status update
app.patch('/api/jobs/:id/status', async (req, res) => {
  try {
    const { status, confirmedWorkerId } = req.body;
    const result = await updateJobStatus(req.params.id, status, confirmedWorkerId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reviews Routes
app.get('/api/reviews/worker/:workerId', async (req, res) => {
  try {
    const reviews = await getReviewsByWorker(req.params.workerId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const result = await createReview(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PRODUCTION SETUP ---
// Serve static files from the React app build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// For any request that doesn't match an API route, send back the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
