const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
// Path of data/
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const NOTE_FILE = path.join(DATA_DIR, 'note.txt');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

// Read note
app.get('/api/note', async (req, res) => {
  try {
    let content = '';
    let updatedAt = null;
    if (fs.existsSync(NOTE_FILE)) {
      content = fs.readFileSync(NOTE_FILE, 'utf8');
      const stat = fs.statSync(NOTE_FILE);
      updatedAt = stat.mtime;
    }
    return res.json({ content, updatedAt });
  } catch (error) {
    console.error('Failed to read note:', error);
    return res.status(500).json({ error: 'Failed to read note' });
  }
});

// Write note
app.post('/api/note', async (req, res) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content : '';
    if (content.length > 1_000_000) {
      return res.status(413).json({ error: 'Content too large' });
    }
    fs.writeFileSync(NOTE_FILE, content, 'utf8');
    const stat = fs.statSync(NOTE_FILE);
    return res.json({ ok: true, savedAt: stat.mtime });
  } catch (error) {
    console.error('Failed to write note:', error);
    return res.status(500).json({ error: 'Failed to write note' });
  }
});

// In production, serve frontend build
// Priority: FRONTEND_DIST env > local ./public (for combined dist)
const FRONTEND_DIST = process.env.FRONTEND_DIST;
const LOCAL_PUBLIC = path.join(__dirname, 'public');
const STATIC_DIR = FRONTEND_DIST && fs.existsSync(FRONTEND_DIST)
  ? FRONTEND_DIST
  : (fs.existsSync(path.join(LOCAL_PUBLIC, 'index.html')) ? LOCAL_PUBLIC : null);

if (STATIC_DIR) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`notepad server running at http://localhost:${PORT}`);
});

// Add error handling
app.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use, application will exit`);
    process.exit(1); // Exit process, non-zero status code indicates error
  } else {
    console.error('Server error:', error);
  }
});

// Ensure process exits on uncaught exceptions
app.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

app.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise rejection:', reason);
  process.exit(1);
});