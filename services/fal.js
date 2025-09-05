const fal = require('@fal-ai/serverless-client');
const fs = require('fs');
const path = require('path');

class FalService {
  constructor() {
    fal.config({
      credentials: process.env.FAL_KEY
    });
  }

  async createVideoTransition(fromImagePath, toImagePath, chapterIndex) {
    try {
      // Convert images to base64 for fal.ai
      const fromImageData = fs.readFileSync(fromImagePath);
      const fromImageBase64 = `data:image/png;base64,${fromImageData.toString('base64')}`;

      // Use Kling for high-quality image-to-video
      const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
        input: {
          image_url: fromImageBase64,
          prompt: `Smooth cinematic transition, gentle camera movement, maintain scene consistency, 5 seconds`,
          duration: 5,
          aspect_ratio: '16:9'
        }
      });

      if (result.video && result.video.url) {
        // Download the video
        const response = await fetch(result.video.url);
        const videoBuffer = await response.arrayBuffer();
        
        const filename = `transition_${chapterIndex}.mp4`;
        const filepath = path.join('generated', filename);
        fs.writeFileSync(filepath, Buffer.from(videoBuffer));
        
        return filepath;
      }
      
      throw new Error('No video generated');
    } catch (error) {
      console.error('Fal.ai video generation error:', error);
      // Return null if video generation fails - app can continue without transitions
      return null;
    }
  }

  async enhanceImage(imagePath, description) {
    try {
      const imageData = fs.readFileSync(imagePath);
      const imageBase64 = `data:image/png;base64,${imageData.toString('base64')}`;

      const result = await fal.subscribe('fal-ai/flux-pro/v1.1-ultra', {
        input: {
          image_url: imageBase64,
          prompt: `Enhance and improve this image: ${description}. Make it more cinematic, detailed, and visually striking.`,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          safety_tolerance: 2
        }
      });

      if (result.images && result.images[0]) {
        const response = await fetch(result.images[0].url);
        const enhancedBuffer = await response.arrayBuffer();
        
        const enhancedPath = imagePath.replace('.png', '_enhanced.png');
        fs.writeFileSync(enhancedPath, Buffer.from(enhancedBuffer));
        
        return enhancedPath;
      }
      
      return imagePath; // Return original if enhancement fails
    } catch (error) {
      console.error('Image enhancement error:', error);
      return imagePath; // Return original if enhancement fails
    }
  }

  async createStoryVideo(imagePaths, audioPaths) {
    // This would combine all images and audio into a final story video
    // For the hackathon, we'll focus on individual transitions
    // A full implementation would use FFmpeg or similar
    console.log('Story video creation would combine:', { imagePaths, audioPaths });
    return null;
  }
}

module.exports = FalService;