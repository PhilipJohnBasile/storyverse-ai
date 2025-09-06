const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Routes
app.use('/api/story', require('./routes/story')); // Keep old routes for compatibility
app.use('/api/storyverse', require('./routes/storyverse')); // New StoryVerse routes

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 StoryVerse running on http://localhost:${PORT}`);
  console.log(`📚 Master Your Story in 5 Essential Steps`);
  console.log(`📝 Make sure to create .env file with your API keys`);
});