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
        - Include as many characters as needed for a rich story (2-6 main characters recommended)
        - Story should have emotional highs and lows
        - End with a satisfying conclusion
        
        Format as JSON:
        {
          "title": "Story Title",
          "characters": [
            {
              "name": "Character Name",
              "age": "Age if relevant",
              "physical_description": "Specific visual details: height, build, hair color/style, eye color, distinctive features, clothing style",
              "core_motivation": "What drives them? What do they want?",
              "internal_conflict": "What holds them back? What do they struggle with?",
              "relationship_role": "How they relate to other characters",
              "character_arc_hint": "How they might change throughout the story",
              "voice_style": "Speaking style and personality traits",
              "visual_consistency_notes": "Key visual elements that must stay consistent across scenes"
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
      console.error('Story generation error:', error);
      throw new Error('Gemini API is currently unavailable. Please try again later.');
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
        .map(c => `${c.name}: ${c.physical_description || c.description}${c.visual_consistency_notes ? ` | Consistency: ${c.visual_consistency_notes}` : ''}`)
        .join('\n');

      const imagePrompt = [
        {
          text: `Create a cinematic scene for this story chapter:
          
          SCENE: ${chapter.scene_description}
          
          CHARACTERS IN SCENE:
          ${characterDescriptions}
          
          VISUAL CONSISTENCY REQUIREMENTS:
          - Maintain exact character appearance as described above
          - Use photorealistic, cinematic style
          - Consistent lighting and composition
          - High detail and professional quality
          ${previousImage ? '- Maintain character consistency with the previous image reference' : ''}
          
          STYLE: Cinematic photography, dramatic lighting, storytelling composition
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
      const prompt = `Create a detailed character reference sheet for ${character.name}:

      PHYSICAL DETAILS: ${character.physical_description || character.description}
      VISUAL CONSISTENCY NOTES: ${character.visual_consistency_notes || 'Maintain consistent appearance across all scenes'}
      
      CHARACTER REFERENCE REQUIREMENTS:
      - Multiple angles: front view, side profile, back view
      - Full body and close-up face shots
      - Show distinctive clothing/accessories
      - Consistent lighting and style
      - Professional character design sheet layout
      - Clean white/neutral background
      - High detail and clarity for reference use
      
      STYLE: Photorealistic character study, consistent art style, reference sheet format
      PURPOSE: This will be used as visual reference for maintaining character consistency in story scenes`;

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