const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const expressWs = require('express-ws');
const app = express();
expressWs(app);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many login attempts, please try again after 15 minutes.' }
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests, please try again later.' }
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Prevent parameter pollution
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const userRoutes = require('./routes/users');
const learningPathRoutes = require('./routes/learningPaths');
const aiRoutes = require('./routes/ai');
const dailyRoutes = require('./routes/daily');
const reconRoutes = require('./routes/recon');
const vtRoutes = require('./routes/virustotal');
const notificationRoutes = require('./routes/notifications');
const labRoutes     = require('./routes/labs');
const exploitRoutes      = require('./routes/exploits');
const certificateRoutes  = require('./routes/certificates');
const searchRoutes       = require('./routes/search');
const analyticsRoutes    = require('./routes/analytics');
const bookmarkRoutes     = require('./routes/bookmarks');
const activityRoutes     = require('./routes/activity');
const eventRoutes        = require('./routes/events');
const classroomRoutes    = require('./routes/classrooms');
const writeupRoutes      = require('./routes/writeups');
const ratingRoutes       = require('./routes/ratings');
const adminRoutes        = require('./routes/admin');
const examRoutes         = require('./routes/exams');
const notesRoutes        = require('./routes/notes');
const referenceRoutes    = require('./routes/reference');
const studyPlanRoutes    = require('./routes/studyPlans');
const courseRoutes       = require('./routes/courses');
const universityRoutes   = require('./routes/university');
const assignmentRoutes   = require('./routes/assignments');
const labBuilderRoutes   = require('./routes/labBuilder');
const oauthRoutes        = require('./routes/oauth');
const { setupLabWebSocket } = require('./utils/wsTerminal');
const { sendWeeklyDigests } = require('./utils/digest');

setupLabWebSocket(app);

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/paths', learningPathRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/recon', reconRoutes);
app.use('/api/vt', vtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/exploits',      exploitRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/writeups', writeupRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lab-builder', labBuilderRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/oauth', oauthRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'CyberLab API is running!', version: '1.0.0' });
});

// Public platform stats — no auth required
app.get('/api/stats', async (req, res) => {
  try {
    const User      = require('./models/User');
    const Challenge = require('./models/Challenge');
    const Lab       = require('./models/Lab');
    const [users, challenges, labs] = await Promise.all([
      User.countDocuments(),
      Challenge.countDocuments(),
      Lab.countDocuments({ isActive: true })
    ]);
    res.json({ users, challenges, labs, categories: 5 });
  } catch (err) {
    res.status(500).json({ users: 0, challenges: 0, labs: 0, categories: 5 });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  });
});

// Connect to MongoDB
const { cleanupExpiredSessions } = require('./utils/docker');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    cleanupExpiredSessions();
    setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

    // Weekly digest — Mondays at 9am (checks hourly)
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 5) {
        sendWeeklyDigests().catch(console.error);
      }
    }, 60 * 60 * 1000);

    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${port} is already in use.`);
        console.error('Run: npm run kill-port');
        console.error('Or stop the other terminal running the server.\n');
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });