const express = require('express');
const router = express.Router();
const GeminiService = require('../services/gemini');
const fs = require('fs');
const path = require('path');

const gemini = new GeminiService();

// In-memory storage for demo (use database in production)
const storyCache = new Map();

router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Story prompt is required' });
  }

  try {
    console.log('🎬 Generating story outline...');
    const storyData = await gemini.generateStoryOutline(prompt);
    
    const storyId = Date.now().toString();
    storyCache.set(storyId, {
      ...storyData,
      status: 'outline_complete',
      progress: 10
    });

    res.json({
      story_id: storyId,
      story: storyData,
      status: 'outline_complete'
    });

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ error: 'Failed to generate story outline' });
  }
});

router.post('/generate-visuals/:storyId', async (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  try {
    console.log('🎨 Generating character references...');
    const characterImages = {};
    
    for (const character of story.characters) {
      const imagePath = await gemini.generateCharacterReference(character);
      if (imagePath) {
        characterImages[character.name] = imagePath;
      } else {
        console.log(`⚠️ Skipping character image for ${character.name} due to API limits`);
        characterImages[character.name] = null;
      }
      
      // Update progress
      story.progress = 20 + (Object.keys(characterImages).length / story.characters.length) * 20;
      storyCache.set(storyId, story);
    }

    console.log('🖼️ Generating chapter images...');
    const chapterImages = [];
    let previousImage = null;

    for (let i = 0; i < story.chapters.length; i++) {
      const imagePath = await gemini.generateChapterImage(story, i, previousImage);
      
      if (imagePath) {
        chapterImages.push(imagePath);
        previousImage = imagePath;
      } else {
        console.log(`⚠️ Skipping chapter ${i + 1} image due to API limits`);
        chapterImages.push(null);
      }
      
      // Update progress
      story.progress = 40 + (i + 1) / story.chapters.length * 60; // Take up more progress since no audio/video
      storyCache.set(storyId, story);
    }

    story.character_images = characterImages;
    story.chapter_images = chapterImages;
    story.status = 'complete';
    story.progress = 100;
    storyCache.set(storyId, story);

    res.json({
      status: 'complete',
      character_images: characterImages,
      chapter_images: chapterImages
    });

  } catch (error) {
    console.error('Visual generation error:', error);
    res.status(500).json({ error: 'Failed to generate visuals' });
  }
});

// Audio and video generation removed - focusing on visual storytelling only

router.get('/status/:storyId', (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json({
    status: story.status,
    progress: story.progress,
    title: story.title,
    chapters_count: story.chapters ? story.chapters.length : 0
  });
});

router.get('/complete/:storyId', (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  // Return complete story data
  res.json(story);
});

// Serve generated files
router.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join('generated', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(path.resolve(filepath));
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;