// Quick API test script
require('dotenv').config();

const GeminiService = require('./services/gemini');
const FalService = require('./services/fal');

async function testAPIs() {
    console.log('🧪 Testing StoryVerse AI APIs...\n');

    // Test Gemini
    console.log('🎨 Testing Gemini API...');
    try {
        const gemini = new GeminiService();
        const story = await gemini.generateStoryOutline('A brave dragon learning to fly');
        console.log('✅ Gemini: Story generated -', story.title);
        console.log('  - Characters:', story.characters.length);
        console.log('  - Chapters:', story.chapters.length);
    } catch (error) {
        console.log('❌ Gemini Error:', error.message);
    }

    console.log('\n🎬 Testing fal.ai API...');
    try {
        const fal = new FalService();
        console.log('✅ fal.ai: Service initialized (will test with actual images later)');
    } catch (error) {
        console.log('❌ fal.ai Error:', error.message);
    }

    console.log('\n🎵 ElevenLabs: Not configured yet (optional)');
    
    console.log('\n🏆 Status: Ready to create amazing stories!');
    console.log('🌐 Visit: http://localhost:3000');
}

testAPIs().catch(console.error);