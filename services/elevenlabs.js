const { ElevenLabs } = require('@elevenlabs/elevenlabs-js');
const fs = require('fs');
const path = require('path');

class ElevenLabsService {
  constructor() {
    this.client = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    
    // Pre-selected voice IDs for different character types
    this.voiceProfiles = {
      'narrator': '21m00Tcm4TlvDq8ikWAM', // Rachel (calm, storytelling)
      'hero_male': 'ErXwobaYiN019PkySvjV', // Antoni (confident male)
      'hero_female': 'EXAVITQu4vr4xnSDxMaL', // Bella (strong female)
      'wise_character': 'VR6AewLTigWG4xSOukaG', // Arnold (wise, older)
      'villain': 'pNInz6obpgDQGcFmaJgB', // Adam (dramatic)
      'child': 'XB0fDUnXU5powFXDhCwa', // Charlotte (young, energetic)
      'mystical': 'oWAxZDx7w5VEj9dCyTzz', // Grace (ethereal)
    };
  }

  selectVoiceForCharacter(character) {
    const description = character.description.toLowerCase();
    const voiceStyle = character.voice_style.toLowerCase();
    
    // Smart voice selection based on character description
    if (description.includes('child') || description.includes('young')) {
      return this.voiceProfiles.child;
    } else if (description.includes('old') || description.includes('wise') || voiceStyle.includes('wise')) {
      return this.voiceProfiles.wise_character;
    } else if (description.includes('evil') || description.includes('dark') || voiceStyle.includes('menacing')) {
      return this.voiceProfiles.villain;
    } else if (description.includes('mystical') || description.includes('magical')) {
      return this.voiceProfiles.mystical;
    } else if (description.includes('female') || description.includes('woman') || description.includes('girl')) {
      return this.voiceProfiles.hero_female;
    } else {
      return this.voiceProfiles.hero_male;
    }
  }

  async generateNarration(text, chapterIndex) {
    try {
      const response = await this.client.textToSpeech.convert({
        voice_id: this.voiceProfiles.narrator,
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      });

      const filename = `narration_${chapterIndex + 1}.mp3`;
      const filepath = path.join('generated', filename);
      
      fs.writeFileSync(filepath, response);
      return filepath;
    } catch (error) {
      console.error('ElevenLabs narration error:', error);
      return null;
    }
  }

  async generateCharacterDialogue(character, dialogue, chapterIndex, lineNumber = 0) {
    try {
      const voiceId = this.selectVoiceForCharacter(character);
      
      const response = await this.client.textToSpeech({
        voiceId: voiceId,
        text: dialogue,
        modelId: 'eleven_multilingual_v2',
        voiceSettings: {
          stability: 0.6,
          similarity_boost: 0.9,
          style: 0.4
        }
      });

      const filename = `dialogue_${character.name.toLowerCase().replace(' ', '_')}_${chapterIndex + 1}_${lineNumber}.mp3`;
      const filepath = path.join('generated', filename);
      
      fs.writeFileSync(filepath, response);
      return filepath;
    } catch (error) {
      console.error('Character dialogue error:', error);
      return null;
    }
  }

  async generateIntroduction(storyTitle) {
    const introText = `Welcome to ${storyTitle}. Let me tell you an incredible story that will take you on an unforgettable journey.`;
    
    try {
      const response = await this.client.textToSpeech({
        voiceId: this.voiceProfiles.narrator,
        text: introText,
        modelId: 'eleven_multilingual_v2',
        voiceSettings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      });

      const filepath = path.join('generated', 'intro.mp3');
      
      fs.writeFileSync(filepath, response);
      return filepath;
    } catch (error) {
      console.error('Introduction generation error:', error);
      return null;
    }
  }

  async generateSummary(storyData) {
    const summaryText = `And so ends our tale of ${storyData.title}. Thank you for joining us on this incredible journey through the world of ${storyData.characters.map(c => c.name).join(', ')}.`;
    
    try {
      const response = await this.client.textToSpeech({
        voiceId: this.voiceProfiles.narrator,
        text: summaryText,
        modelId: 'eleven_multilingual_v2',
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2
        }
      });

      const filepath = path.join('generated', 'outro.mp3');
      
      fs.writeFileSync(filepath, response);
      return filepath;
    } catch (error) {
      console.error('Summary generation error:', error);
      return null;
    }
  }
}

module.exports = ElevenLabsService;