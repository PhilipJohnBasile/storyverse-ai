// Simplified ElevenLabs service for the hackathon
const fs = require('fs');
const path = require('path');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
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

  async generateAudioWithFetch(text, voiceId, filename) {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const filepath = path.join('generated', filename);
      fs.writeFileSync(filepath, Buffer.from(audioBuffer));
      
      return filepath;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      return null;
    }
  }

  async generateNarration(text, chapterIndex) {
    const filename = `narration_${chapterIndex + 1}.mp3`;
    return await this.generateAudioWithFetch(text, this.voiceProfiles.narrator, filename);
  }

  async generateCharacterDialogue(character, dialogue, chapterIndex, lineNumber = 0) {
    const voiceId = this.selectVoiceForCharacter(character);
    const filename = `dialogue_${character.name.toLowerCase().replace(' ', '_')}_${chapterIndex + 1}_${lineNumber}.mp3`;
    return await this.generateAudioWithFetch(dialogue, voiceId, filename);
  }

  async generateIntroduction(storyTitle) {
    const introText = `Welcome to ${storyTitle}. Let me tell you an incredible story that will take you on an unforgettable journey.`;
    const filename = 'intro.mp3';
    return await this.generateAudioWithFetch(introText, this.voiceProfiles.narrator, filename);
  }

  async generateSummary(storyData) {
    const summaryText = `And so ends our tale of ${storyData.title}. Thank you for joining us on this incredible journey through the world of ${storyData.characters.map(c => c.name).join(', ')}.`;
    const filename = 'outro.mp3';
    return await this.generateAudioWithFetch(summaryText, this.voiceProfiles.narrator, filename);
  }
}

module.exports = ElevenLabsService;