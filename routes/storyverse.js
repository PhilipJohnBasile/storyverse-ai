const express = require('express');
const router = express.Router();
const GeminiService = require('../services/gemini');
const fs = require('fs');
const path = require('path');

const gemini = new GeminiService();

// In-memory storage for demo (use database in production)
const storyCache = new Map();

// Generate story ideas based on foundation and discovery data
router.post('/generate-ideas', async (req, res) => {
  const { foundationData, discoveryData } = req.body;
  
  try {
    console.log('🧠 Generating story ideas...');
    
    const prompt = `
      Based on this story foundation and brainstorming, help expand and refine the ideas:
      
      FOUNDATION:
      - Reader feeling desired: ${foundationData['reader-feeling'] || 'Not specified'}
      - Conversation to spark: ${foundationData['book-conversation'] || 'Not specified'}
      - Personal connection: ${foundationData['personal-connection'] || 'Not specified'}
      - Genre: ${foundationData['genre'] || 'Not specified'}
      - Genre promise: ${foundationData['genre-promise'] || 'Not specified'}
      - Theme: ${foundationData['theme'] || 'Not specified'}
      - Vision/Mood: ${foundationData['vision-board'] || 'Not specified'}
      
      BRAINSTORMING:
      - Brain dump: ${discoveryData['brain-dump'] || 'Not specified'}
      - What if question: ${discoveryData['what-if'] || 'Not specified'}
      - What if outcomes: ${discoveryData['what-if-outcomes'] || 'Not specified'}
      - Premise: ${discoveryData['premise'] || 'Not specified'}
      
      Please provide:
      1. **Refined Premise**: A polished 1-2 sentence premise that captures the essence
      2. **Story Hooks**: 3-4 compelling opening scenarios that could grab readers immediately
      3. **Conflict Escalation**: How the central conflict could build throughout the story
      4. **Unique Angles**: What makes this story different from others in the genre
      5. **Theme Integration**: How the theme can be woven naturally into the plot
      
      Format as HTML with clear headings and bullet points for easy reading.
    `;

    const ideas = await gemini.generateWritingGuidance(prompt);
    
    res.json({
      content: ideas,
      status: 'success'
    });

  } catch (error) {
    console.error('Story ideas generation error:', error);
    res.status(500).json({ error: 'Failed to generate story ideas' });
  }
});

// Develop characters based on foundation, discovery, and character data
router.post('/develop-characters', async (req, res) => {
  const { foundationData, discoveryData, characterData, supportingCharacters } = req.body;
  
  try {
    console.log('🎭 Developing characters...');
    
    const prompt = `
      Help develop rich, compelling characters based on this information:
      
      STORY CONTEXT:
      - Theme: ${foundationData['theme'] || 'Not specified'}
      - Genre: ${foundationData['genre'] || 'Not specified'}
      - Premise: ${discoveryData['premise'] || 'Not specified'}
      
      MAIN CHARACTER:
      - Name: ${characterData['main-character-name'] || 'Not specified'}
      - Goal: ${characterData['character-goal'] || 'Not specified'}
      - Obstacle: ${characterData['character-obstacle'] || 'Not specified'}
      - Flaw: ${characterData['character-flaw'] || 'Not specified'}
      - Backstory: ${characterData['character-backstory'] || 'Not specified'}
      - Vulnerability: ${characterData['character-vulnerability'] || 'Not specified'}
      
      SUPPORTING CHARACTERS:
      ${supportingCharacters.map(char => `
        - ${char.name}: ${char.relationship} | Role: ${char.role} | Traits: ${char.traits}
      `).join('') || 'None specified'}
      
      Please provide:
      1. **Main Character Enhancement**: Deeper personality traits, quirks, speech patterns, and how they'll change
      2. **Character Voice**: How they speak, think, and express themselves uniquely
      3. **Relationship Dynamics**: How characters interact and create tension/chemistry
      4. **Character Arcs**: How each character grows or changes throughout the story
      5. **Conflict Sources**: Internal and external conflicts that drive character development
      6. **Dialogue Samples**: Example conversations that show their distinct voices
      
      Format as HTML with clear headings and engaging descriptions.
    `;

    const characterDevelopment = await gemini.generateWritingGuidance(prompt);
    
    res.json({
      content: characterDevelopment,
      status: 'success'
    });

  } catch (error) {
    console.error('Character development error:', error);
    res.status(500).json({ error: 'Failed to develop characters' });
  }
});

// Build world based on foundation, discovery, character, and world data
router.post('/build-world', async (req, res) => {
  const { foundationData, discoveryData, characterData, worldData } = req.body;
  
  try {
    console.log('🌍 Building world...');
    
    const prompt = `
      Help enhance the world-building for this story:
      
      STORY CONTEXT:
      - Genre: ${foundationData['genre'] || 'Not specified'}
      - Theme: ${foundationData['theme'] || 'Not specified'}
      - Premise: ${discoveryData['premise'] || 'Not specified'}
      
      WORLD ELEMENTS:
      - Rules of reality: ${worldData['world-rules'] || 'Not specified'}
      - Smells: ${worldData['world-smell'] || 'Not specified'}
      - Sounds: ${worldData['world-sounds'] || 'Not specified'}
      - Textures: ${worldData['world-textures'] || 'Not specified'}
      - Visual details: ${worldData['world-visuals'] || 'Not specified'}
      - Symbolic setting: ${worldData['symbolic-setting'] || 'Not specified'}
      
      Please provide:
      1. **Atmospheric Details**: Rich sensory descriptions that immerse readers
      2. **Setting as Character**: How the environment influences and reflects the story
      3. **Cultural Elements**: Social norms, customs, or systems that affect characters
      4. **Hidden Details**: Small world-building elements that add authenticity
      5. **Symbolic Layers**: How settings reinforce themes and character arcs
      6. **Conflict Sources**: Environmental or societal tensions that drive plot
      
      Make the world feel lived-in and authentic to the genre and theme.
      Format as HTML with vivid, engaging descriptions.
    `;

    const worldBuilding = await gemini.generateWritingGuidance(prompt);
    
    res.json({
      content: worldBuilding,
      status: 'success'
    });

  } catch (error) {
    console.error('World building error:', error);
    res.status(500).json({ error: 'Failed to enhance world-building' });
  }
});

// Develop plot structure based on all collected data
router.post('/develop-plot', async (req, res) => {
  const { allData } = req.body;
  
  try {
    console.log('📖 Developing plot structure...');
    
    const prompt = `
      Create a detailed plot structure based on all this story development:
      
      FOUNDATION:
      - Theme: ${allData.step1?.theme || 'Not specified'}
      - Genre: ${allData.step1?.genre || 'Not specified'}
      - Reader feeling: ${allData.step1?.['reader-feeling'] || 'Not specified'}
      
      DISCOVERY:
      - Premise: ${allData.step2?.premise || 'Not specified'}
      - What if: ${allData.step2?.['what-if'] || 'Not specified'}
      
      CHARACTER:
      - Main character: ${allData.step3?.['main-character-name'] || 'Not specified'}
      - Goal: ${allData.step3?.['character-goal'] || 'Not specified'}
      - Obstacle: ${allData.step3?.['character-obstacle'] || 'Not specified'}
      - Flaw: ${allData.step3?.['character-flaw'] || 'Not specified'}
      
      WORLD:
      - Setting rules: ${allData.step4?.['world-rules'] || 'Not specified'}
      - Symbolic elements: ${allData.step4?.['symbolic-setting'] || 'Not specified'}
      
      PLOT POINTS:
      - Hook: ${allData.step5?.hook || 'Not specified'}
      - Turning Point 1: ${allData.step5?.['turning-point-1'] || 'Not specified'}
      - Turning Point 2: ${allData.step5?.['turning-point-2'] || 'Not specified'}
      - Turning Point 3: ${allData.step5?.['turning-point-3'] || 'Not specified'}
      - Climax: ${allData.step5?.climax || 'Not specified'}
      - Resolution: ${allData.step5?.resolution || 'Not specified'}
      
      Please provide:
      1. **Detailed Outline**: Chapter-by-chapter breakdown with key events
      2. **Pacing Guide**: How to balance action, character development, and world-building
      3. **Tension Arc**: How conflict builds and releases throughout the story
      4. **Character Integration**: How plot serves character arcs and vice versa
      5. **Theme Weaving**: How plot events reinforce the central theme
      6. **Subplot Suggestions**: Secondary storylines that enrich the main plot
      
      Create a roadmap that turns your concept into a compelling narrative journey.
      Format as HTML with clear structure and actionable guidance.
    `;

    const plotDevelopment = await gemini.generateWritingGuidance(prompt);
    
    res.json({
      content: plotDevelopment,
      status: 'success'
    });

  } catch (error) {
    console.error('Plot development error:', error);
    res.status(500).json({ error: 'Failed to develop plot structure' });
  }
});

// Generate complete story overview
router.post('/complete-overview', async (req, res) => {
  const { allData, supportingCharacters } = req.body;
  
  try {
    console.log('✨ Generating complete story guide...');
    
    const prompt = `
      You are creating the ultimate story development bible - a comprehensive guide that transforms scattered ideas into a cohesive, publishable story. This should be the writer's complete roadmap from concept to finished manuscript.

      FOUNDATION & VISION:
      - Core Theme: ${allData.step1?.theme || 'Not specified'}
      - Genre: ${allData.step1?.genre || 'Not specified'}
      - Reader Emotional Journey: ${allData.step1?.['reader-feeling'] || 'Not specified'}
      - Cultural Conversation: ${allData.step1?.['book-conversation'] || 'Not specified'}
      - Author's Personal Connection: ${allData.step1?.['personal-connection'] || 'Not specified'}
      - Genre Promise: ${allData.step1?.['genre-promise'] || 'Not specified'}
      - Story Atmosphere/Vision: ${allData.step1?.['vision-board'] || 'Not specified'}
      
      DISCOVERY & BRAINSTORMING:
      - Core Premise: ${allData.step2?.premise || 'Not specified'}
      - Central "What If": ${allData.step2?.['what-if'] || 'Not specified'}
      - Story Possibilities: ${allData.step2?.['what-if-outcomes'] || 'Not specified'}
      - Creative Brain Dump: ${allData.step2?.['brain-dump'] || 'Not specified'}
      
      CHARACTERS:
      Main Character:
      - Name: ${allData.step3?.['main-character-name'] || 'Not specified'}
      - External Goal: ${allData.step3?.['character-goal'] || 'Not specified'}
      - Primary Obstacle: ${allData.step3?.['character-obstacle'] || 'Not specified'}
      - Character Flaw/Weakness: ${allData.step3?.['character-flaw'] || 'Not specified'}
      - Formative Backstory: ${allData.step3?.['character-backstory'] || 'Not specified'}
      - Relatable Vulnerability: ${allData.step3?.['character-vulnerability'] || 'Not specified'}
      
      Supporting Cast:
      ${supportingCharacters.map(char => `
        - ${char.name || 'Unnamed'}: Relationship: ${char.relationship || 'Unknown'} | Story Role: ${char.role || 'Unknown'} | Key Traits: ${char.traits || 'Not defined'}
      `).join('') || 'No supporting characters defined yet'}
      
      WORLD-BUILDING:
      - Reality Framework: ${allData.step4?.['world-rules'] || 'Not specified'}
      - Sensory Landscape: 
        * Scents: ${allData.step4?.['world-smell'] || 'Not specified'}
        * Sounds: ${allData.step4?.['world-sounds'] || 'Not specified'}  
        * Textures: ${allData.step4?.['world-textures'] || 'Not specified'}
        * Visual Elements: ${allData.step4?.['world-visuals'] || 'Not specified'}
      - Symbolic Environment: ${allData.step4?.['symbolic-setting'] || 'Not specified'}
      
      PLOT STRUCTURE:
      - Opening Hook: ${allData.step5?.hook || 'Not specified'}
      - Turning Point 1: ${allData.step5?.['turning-point-1'] || 'Not specified'}
      - Turning Point 2: ${allData.step5?.['turning-point-2'] || 'Not specified'}
      - Turning Point 3: ${allData.step5?.['turning-point-3'] || 'Not specified'}
      - Story Climax: ${allData.step5?.climax || 'Not specified'}
      - Resolution: ${allData.step5?.resolution || 'Not specified'}
      - Structure Framework: ${allData.step5?.framework || 'Not specified'}
      
      Create a masterful story development guide with these sections:

      ## 🎯 STORY DNA - Your North Star
      
      **ONE-SENTENCE HOOK**: A single, powerful sentence that captures your story's essence
      **ELEVATOR PITCH**: 2-3 sentences that make agents/readers desperate to know more  
      **THEMATIC STATEMENT**: What truth about life does your story explore?
      **GENRE PROMISE & TWIST**: How you'll satisfy expectations while surprising readers
      **TARGET READER PROFILE**: Who needs this story and why?
      
      ## 📖 STORY BIBLE - Your Complete Reference
      
      **PREMISE EXPANSION**: Your core concept developed into compelling story territory
      **STAKES CASCADE**: Personal → Professional → Universal - what happens if protagonist fails?
      **TONE & VOICE GUIDE**: How this story should sound and feel on the page
      **THEME INTEGRATION MAP**: How theme weaves through plot, character, and setting naturally
      
      ## 🎭 CHARACTER CONSTELLATION
      
      **PROTAGONIST DEEP DIVE**: 
      - Internal/External goals and how they conflict
      - Character arc trajectory from beginning to end
      - Unique voice patterns and dialogue style
      - Fatal flaw and how it drives the plot
      - Backstory that matters to the current story
      
      **SUPPORTING CHARACTER DYNAMICS**:
      - How each character challenges/supports the protagonist differently
      - Relationship triangles and tensions that drive scenes
      - Character functions: mentor, threshold guardian, ally, enemy, love interest
      - Contrasting worldviews that create natural conflict
      
      **CHARACTER INTERACTION MATRIX**: Who sparks what kind of scenes together
      
      ## 🌍 WORLD AS CHARACTER
      
      **SETTING THAT BREATHES**: Locations that feel alive and influence plot
      **CULTURAL DEPTH**: Rules, customs, conflicts that create story opportunities  
      **SENSORY IMMERSION GUIDE**: How to drop readers into your world instantly
      **SYMBOLIC ARCHITECTURE**: How environment reflects internal journeys
      **SETTING-DRIVEN CONFLICTS**: How your world creates obstacles and opportunities
      
      ## 📚 STORY ARCHITECTURE - Your Chapter-by-Chapter Guide
      
      **ACT BREAKDOWN**: 
      - Act I: Setup and inciting incident (approx. chapters 1-${Math.ceil(8 * 0.25)})
      - Act II-A: Rising action and obstacles (chapters ${Math.ceil(8 * 0.25) + 1}-${Math.ceil(8 * 0.5)})  
      - Act II-B: Deepening conflict and stakes (chapters ${Math.ceil(8 * 0.5) + 1}-${Math.ceil(8 * 0.75)})
      - Act III: Climax and resolution (chapters ${Math.ceil(8 * 0.75) + 1}-8+)
      
      **SCENE-BY-SCENE BLUEPRINT**: 
      For each major turning point, provide:
      - Scene purpose (plot advancement + character development)
      - Emotional temperature and pacing notes
      - Key dialogue/action moments that must happen
      - How this scene sets up the next one
      
      **PACING PRESCRIPTION**: Balance of action, dialogue, introspection, and world-building
      
      ## ✍️ WRITING EXECUTION STRATEGY
      
      **DAILY WRITING APPROACH**:
      - Optimal chapter length for your genre (typically 2,000-4,000 words)
      - Scene structure template for consistency
      - Revision checkpoints and self-editing guidelines
      
      **GENRE-SPECIFIC CHALLENGES TO AVOID**:
      - Common tropes that need fresh twists
      - Pacing pitfalls typical in ${allData.step1?.genre || 'your chosen genre'}
      - Reader expectation management
      
      **THEME WEAVING TECHNIQUES**:
      - Subtle ways to reinforce theme without preaching  
      - Character actions that demonstrate theme
      - Plot events that test thematic questions
      
      ## 🎪 READER EXPERIENCE DESIGN
      
      **EMOTIONAL ROLLER COASTER**: Map of high/low emotional moments
      **PAGE-TURNER MECHANICS**: Cliffhangers, revelations, and hooks that keep readers engaged
      **PAYOFF PROMISES**: What questions you raise and when/how you answer them
      **SATISFYING CONCLUSION CHECKLIST**: All threads resolved, character growth complete, theme delivered
      
      ## 🛠️ REVISION ROADMAP
      
      **FIRST DRAFT PRIORITIES**: Story completion over perfection
      **SECOND DRAFT FOCUS**: Structure, pacing, character consistency  
      **THIRD DRAFT POLISH**: Prose, dialogue, scene-level improvements
      **BETA READER QUESTIONS**: What feedback to seek at each stage
      
      Make this the ultimate writer's companion - detailed enough to prevent writer's block, flexible enough to allow creativity. Use compelling headings, bullet points, and actionable advice. Include specific examples where possible and make every section immediately useful for writing the actual book.
      
      Format as beautiful HTML with proper styling, clear hierarchy, and inspiring presentation.
    `;

    const completeOverview = await gemini.generateWritingGuidance(prompt);
    
    // Store the complete story data
    const storyId = Date.now().toString();
    storyCache.set(storyId, {
      allData,
      supportingCharacters,
      completeOverview,
      createdAt: new Date().toISOString()
    });
    
    res.json({
      content: completeOverview,
      storyId: storyId,
      status: 'success'
    });

  } catch (error) {
    console.error('Complete overview generation error:', error);
    res.status(500).json({ error: 'Failed to generate complete story guide' });
  }
});

// Save story data
router.post('/save-story', async (req, res) => {
  const { storyData, supportingCharacters, timestamp } = req.body;
  
  try {
    const storyId = Date.now().toString();
    
    // In production, save to database
    const storyRecord = {
      id: storyId,
      data: storyData,
      supportingCharacters,
      timestamp,
      createdAt: new Date().toISOString()
    };
    
    storyCache.set(storyId, storyRecord);
    
    // Optionally save to file system as backup
    const filePath = path.join('generated', `story-${storyId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(storyRecord, null, 2));
    
    res.json({
      storyId,
      message: 'Story saved successfully',
      status: 'success'
    });

  } catch (error) {
    console.error('Story save error:', error);
    res.status(500).json({ error: 'Failed to save story' });
  }
});

// Get saved story
router.get('/story/:storyId', (req, res) => {
  const { storyId } = req.params;
  const story = storyCache.get(storyId);
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  res.json(story);
});

// List all saved stories (for future enhancement)
router.get('/stories', (req, res) => {
  const stories = Array.from(storyCache.values()).map(story => ({
    id: story.id,
    title: story.data?.step1?.['reader-feeling'] || 'Untitled Story',
    genre: story.data?.step1?.genre || 'Unknown',
    createdAt: story.createdAt
  }));
  
  res.json({ stories });
});

module.exports = router;