const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.textModel = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.imageModel = this.client.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
  }

  async generateStoryOutline(prompt) {
    try {
      const storyPrompt = `
        Create a compelling 5-chapter story outline based on: "${prompt}"
        
        Requirements:
        - Each chapter should have a clear scene description
        - Include 2-3 main characters with detailed visual descriptions
        - Story should have emotional highs and lows
        - End with a satisfying conclusion
        
        Format as JSON:
        {
          "title": "Story Title",
          "characters": [
            {
              "name": "Character Name",
              "description": "Detailed visual description for consistent generation",
              "voice_style": "Brief description of speaking style"
            }
          ],
          "chapters": [
            {
              "title": "Chapter Title",
              "scene_description": "Detailed scene for image generation",
              "narrative_text": "Story text for this chapter",
              "characters_present": ["character names in this scene"]
            }
          ]
        }
      `;

      const response = await this.textModel.generateContent(storyPrompt);

      // Extract JSON from response
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.log('🎭 Gemini API unavailable, using demo story...');
      
      // Fallback to demo data when API is unavailable
      const demoData = require('../demo-data.json');
      
      // Simple prompt matching for demo
      if (prompt.toLowerCase().includes('detective') || prompt.toLowerCase().includes('cat')) {
        return demoData.detective_cat;
      } else if (prompt.toLowerCase().includes('dragon')) {
        return demoData.dragon_story;
      } else {
        // Default to detective cat story
        return demoData.detective_cat;
      }
    }
  }

  // Helper to wait between API calls
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateChapterImage(storyData, chapterIndex, previousImage = null) {
    try {
      const chapter = storyData.chapters[chapterIndex];
      const relevantCharacters = chapter.characters_present
        .map(name => storyData.characters.find(c => c.name === name))
        .filter(char => char !== undefined);

      const characterDescriptions = relevantCharacters
        .map(c => `${c.name}: ${c.description}`)
        .join('. ');

      const imagePrompt = [
        {
          text: `Create a photorealistic image for this story chapter:
          
          Scene: ${chapter.scene_description}
          Characters in scene: ${characterDescriptions}
          
          Style: Cinematic, highly detailed, consistent character appearance
          ${previousImage ? 'Maintain character consistency with the previous image.' : ''}
          `
        }
      ];

      // Add previous image for character consistency
      if (previousImage && fs.existsSync(previousImage)) {
        const imageData = fs.readFileSync(previousImage);
        imagePrompt.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageData.toString('base64')
          }
        });
      }

      const response = await this.imageModel.generateContent(imagePrompt);

      // Save generated image
      const result = response.response;
      if (result.candidates && result.candidates[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, 'base64');
            const filename = `chapter_${chapterIndex + 1}.png`;
            const filepath = path.join('generated', filename);
            fs.writeFileSync(filepath, buffer);
            return filepath;
          }
        }
      }
      throw new Error('No image generated');
    } catch (error) {
      console.log(`❌ Chapter ${chapterIndex + 1} image generation failed: ${error.message}`);
      if (error.status === 429) {
        console.log(`⏰ Rate limit hit. Consider waiting or upgrading to paid tier.`);
      }
      return null;
    }
  }

  async generateCharacterReference(character) {
    try {
      const prompt = `Create a character reference sheet showing ${character.name}: ${character.description}
      
      Style: Clean character design, multiple angles (front, side, back), consistent appearance, high detail
      Background: Simple white background
      Layout: Character study/reference sheet format`;

      const response = await this.imageModel.generateContent(prompt);

      const result = response.response;
      if (result.candidates && result.candidates[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, 'base64');
            const filename = `character_${character.name.toLowerCase().replace(' ', '_')}.png`;
            const filepath = path.join('generated', filename);
            fs.writeFileSync(filepath, buffer);
            return filepath;
          }
        }
      }
    } catch (error) {
      console.log(`❌ Character reference generation failed: ${error.message}`);
      if (error.status === 429) {
        console.log(`⏰ Rate limit hit. The error suggests waiting 31 seconds before retry.`);
        console.log(`💡 Consider upgrading to paid tier for higher quotas.`);
      }
      return null;
    }
  }
}

module.exports = GeminiService;