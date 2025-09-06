const express = require('express');
const router = express.Router();
const GeminiService = require('../services/gemini');
const FalService = require('../services/fal');
const ElevenLabsService = require('../services/elevenlabs-simple');
const fs = require('fs');
const path = require('path');

const gemini = new GeminiService();
const fal = new FalService();
const elevenlabs = new ElevenLabsService();

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
        // Enhance image with fal.ai
        const enhancedPath = await fal.enhanceImage(imagePath, story.chapters[i].scene_description);
        chapterImages.push(enhancedPath);
        previousImage = enhancedPath;
      } else {
        console.log(`⚠️ Skipping chapter ${i + 1} image due to API limits`);
        chapterImages.push(null);
      }
      
      // Update progress
      story.progress = 40 + (i + 1) / story.chapters.length * 30;
      storyCache.set(storyId, story);
    }

    story.character_images = characterImages;
    story.chapter_images = chapterImages;
    story.status = 'visuals_complete';
    story.progress = 70;
    storyCache.set(storyId, story);

    res.json({
      status: 'visuals_complete',
      character_images: characterImages,
      chapter_images: chapterImages
    });

  } catch (error) {
    console.error('Visual generation error:', error);
    res.status(500).json({ error: 'Failed to generate visuals' });
  }
});

router.post('/generate-audio/:storyId', async (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  try {
    console.log('🎵 Generating introduction...');
    const introPath = await elevenlabs.generateIntroduction(story.title);
    
    console.log('🗣️ Generating chapter narrations...');
    const narrationPaths = [];
    
    for (let i = 0; i < story.chapters.length; i++) {
      const chapter = story.chapters[i];
      const audioPath = await elevenlabs.generateNarration(chapter.narrative_text, i);
      narrationPaths.push(audioPath);
      
      // Update progress
      story.progress = 70 + (i + 1) / story.chapters.length * 20;
      storyCache.set(storyId, story);
    }

    console.log('🎭 Generating summary...');
    const outroPath = await elevenlabs.generateSummary(story);

    story.intro_audio = introPath;
    story.narration_audio = narrationPaths;
    story.outro_audio = outroPath;
    story.status = 'audio_complete';
    story.progress = 90;
    storyCache.set(storyId, story);

    res.json({
      status: 'audio_complete',
      intro_audio: introPath,
      narration_audio: narrationPaths,
      outro_audio: outroPath
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

router.post('/generate-transitions/:storyId', async (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);

  if (!story || !story.chapter_images) {
    return res.status(404).json({ error: 'Story or images not found' });
  }

  try {
    console.log('🎬 Generating video transitions...');
    const transitionVideos = [];

    // Skip video generation if no images were created
    if (!story.chapter_images || story.chapter_images.every(img => !img)) {
      console.log('⚠️ No chapter images available, skipping video transitions');
      story.transition_videos = [];
      story.status = 'complete';
      story.progress = 100;
      storyCache.set(storyId, story);
      
      return res.json({
        status: 'complete',
        transition_videos: []
      });
    }

    // Generate transitions with timeout
    const MAX_TRANSITION_TIME = 30000; // 30 seconds per video
    
    for (let i = 0; i < story.chapter_images.length - 1; i++) {
      if (!story.chapter_images[i] || !story.chapter_images[i + 1]) {
        console.log(`⚠️ Skipping transition ${i}: missing images`);
        transitionVideos.push(null);
        continue;
      }

      try {
        const videoPromise = fal.createVideoTransition(
          story.chapter_images[i],
          story.chapter_images[i + 1],
          i
        );
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Video generation timeout')), MAX_TRANSITION_TIME)
        );
        
        const videoPath = await Promise.race([videoPromise, timeoutPromise]);
        transitionVideos.push(videoPath);
        console.log(`✅ Generated transition video ${i + 1}`);
        
      } catch (error) {
        console.log(`❌ Failed to generate transition ${i}: ${error.message}`);
        transitionVideos.push(null);
      }
    }

    story.transition_videos = transitionVideos;
    story.status = 'complete';
    story.progress = 100;
    storyCache.set(storyId, story);

    res.json({
      status: 'complete',
      transition_videos: transitionVideos
    });

  } catch (error) {
    console.error('Transition generation error:', error);
    res.status(500).json({ error: 'Failed to generate transitions' });
  }
});

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