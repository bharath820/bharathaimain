import fetch from 'node-fetch';
import { config } from './config.js';

// Test script to verify image generation API
async function testImageGeneration() {
  console.log('🧪 Testing Image Generation API...\n');
  
  // Check if Stability AI key is configured
  if (!config.STABILITY_API_KEY) {
    console.error('❌ STABILITY_AI_KEY not configured in environment variables');
    console.log('Please add STABILITY_AI_KEY to your .env file');
    return;
  }
  
  console.log('✅ Stability AI key is configured');
  
  try {
    const response = await fetch('http://localhost:5000/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real JWT token for actual testing
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image generation successful!');
      console.log('Image URL length:', data.imageUrl ? data.imageUrl.length : 'No image URL');
    } else {
      const errorData = await response.json();
      console.error('❌ Image generation failed:', errorData.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testImageGeneration();

