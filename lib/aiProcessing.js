import axios from 'axios';

const deepSeekR1ApiUrl = 'https://api.deepseekr1.com/generate';

export const generateQuestions = async (filePath) => {
  try {
    const response = await axios.post(deepSeekR1ApiUrl, {
      filePath,
    });

    if (response.data.success) {
      return response.data.questions;
    } else {
      throw new Error('Failed to generate questions');
    }
  } catch (error) {
    console.error('AI Processing Error:', error.message);
    throw error;
  }
};
