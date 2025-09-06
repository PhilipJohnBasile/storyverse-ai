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
        Create a detailed book development guide based on: "${prompt}"
        
        Requirements:
        - Focus on character development for authors writing a novel
        - Include detailed character profiles (2-6 main characters recommended)
        - Generate 5 key pivotal scenes that define the story arc
        - Each scene should represent major plot points, character development moments, or emotional climaxes
        - Scenes should be suitable for visual illustration to help authors visualize their book
        
        Format as JSON:
        {
          "title": "Book Title",
          "genre": "Primary genre of the book",
          "target_audience": "Target readership (e.g., Adult Contemporary, YA Fantasy, etc.)",
          "characters": [
            {
              "name": "Character Name",
              "role": "Protagonist/Antagonist/Supporting Character",
              "age": "Age and life stage",
              "occupation": "What they do for work/their role in society",
              "physical_description": "Detailed visual appearance: height, build, hair color/style, eye color, facial features, distinctive marks, typical clothing style, posture, mannerisms",
              "personality_traits": "Key personality characteristics that define them",
              "core_motivation": "Their primary driving goal throughout the book",
              "internal_conflict": "Their main internal struggle or character flaw",
              "backstory_summary": "Brief but crucial background that shapes who they are",
              "character_arc": "How they change from beginning to end of the book",
              "relationships": "Key relationships with other characters",
              "dialogue_voice": "How they speak - formal, casual, accent, speech patterns",
              "visual_consistency_notes": "Key visual elements that must stay consistent across all illustrations"
            }
          ],
          "chapters": [
            {
              "title": "Scene Title",
              "scene_type": "Type of scene (Opening, Inciting Incident, Midpoint, Climax, Resolution)",
              "location": "Where this pivotal scene takes place",
              "scene_description": "Detailed visual description for illustration - setting, lighting, mood, character positions and expressions",
              "narrative_purpose": "Why this scene is crucial to the story - what it reveals or advances",
              "emotional_tone": "The emotional weight and atmosphere of this scene",
              "characters_present": ["character names in this scene"],
              "key_story_moment": "What major plot point or character development happens here"
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

  async generateWritingGuidance(prompt) {
    try {
      const response = await this.textModel.generateContent(prompt);
      
      // Extract text from response
      const text = response.response.text();
      
      // Convert markdown-style formatting to HTML if needed
      let htmlContent = text
        .replace(/## (.*?)$/gm, '<h3>$1</h3>')
        .replace(/# (.*?)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>/g, '</li></ul>');

      // Clean up HTML formatting
      htmlContent = htmlContent
        .replace(/<\/ul><ul>/g, '')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h([0-9])><\/p>/g, '</h$1>')
        .replace(/<p><\/p>/g, '');

      return htmlContent;
      
    } catch (error) {
      console.error('Writing guidance generation error:', error);
      throw new Error('AI writing guidance is currently unavailable. Please try again later.');
    }
  }
}

module.exports = GeminiService;