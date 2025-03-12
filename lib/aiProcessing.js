import axios from 'axios';
import { supabase } from '../src/services/supabaseClient';
import env from '../src/utils/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307'; // Using a faster model for mobile

/**
 * Extracts text content from a document stored in Supabase
 * @param {string} filePath - Path to the file in Supabase storage
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromDocument(filePath) {
  try {
    console.log('Extracting text from document:', filePath);
    
    // Get file from Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);
      
    if (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
    
    // Convert blob to text
    const text = await data.text();
    console.log(`Successfully extracted ${text.length} characters of text`);
    
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Generate aviation-specific questions using Claude AI based on document content
 * @param {string} documentText - Text content of the document
 * @param {number} questionCount - Number of questions to generate (default: 10)
 * @returns {Promise<Array>} - Array of generated questions
 */
async function generateQuestionsWithClaude(documentText, questionCount = 10) {
  try {
    console.log(`Generating ${questionCount} questions with Claude AI`);
    
    // Import the API client
    const apiClient = require('../src/services/apiClient').default;
    
    // Use the API client to generate questions
    const result = await apiClient.generateQuestionsWithClaude(documentText, {
      questionCount: questionCount
    });
    
    console.log('Successfully received response from Claude');
    
    // Process the response into structured question format
    return parseQuestionsFromAIResponse(result.rawResponse, questionCount);
  } catch (error) {
    console.error('Claude AI error:', error.message);
    throw new Error(`Failed to generate questions with AI: ${error.message}`);
  }
}

/**
 * Parse Claude's text response into structured question objects
 * @param {string} aiResponse - Raw text response from Claude
 * @param {number} expectedCount - Expected number of questions
 * @returns {Array} - Array of structured question objects
 */
function parseQuestionsFromAIResponse(aiResponse, expectedCount) {
  try {
    console.log('Parsing AI response into structured questions');
    
    // Split the response by question number pattern
    const questionBlocks = aiResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
    
    const questions = [];
    
    questionBlocks.forEach((block, index) => {
      try {
        // Extract question text (everything before options start)
        const questionMatch = block.match(/(.+?)\n\s*[A-D]\)/s);
        const questionText = questionMatch ? questionMatch[1].trim() : '';
        
        // Extract options
        const optionsRegex = /([A-D])\)\s*([^\n]+)/g;
        const options = [];
        let match;
        
        while ((match = optionsRegex.exec(block)) !== null) {
          options.push({
            id: match[1], // A, B, C, or D
            text: match[2].trim()
          });
        }
        
        // Extract correct answer and explanation
        const correctAnswerMatch = block.match(/Correct answer:\s*([A-D])/i) || 
                                  block.match(/Answer:\s*([A-D])/i);
        const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : '';
        
        const explanationMatch = block.match(/Explanation:\s*(.+?)(?=\n\d|$)/is);
        const explanation = explanationMatch ? explanationMatch[1].trim() : '';
        
        // Only add well-formed questions
        if (questionText && options.length >= 3 && correctAnswer) {
          questions.push({
            id: `q-${Date.now()}-${index}`,
            text: questionText,
            options: options,
            correctOptionId: correctAnswer,
            explanation: explanation
          });
        }
      } catch (parseError) {
        console.warn(`Error parsing question block ${index}:`, parseError);
        // Continue with other questions
      }
    });
    
    console.log(`Successfully parsed ${questions.length} questions`);
    
    // If we didn't get enough questions, fill with fallback questions
    if (questions.length < expectedCount) {
      const missingCount = expectedCount - questions.length;
      console.warn(`Only parsed ${questions.length} questions, adding ${missingCount} fallback questions`);
      
      const fallbackQuestions = generateFallbackQuestions(missingCount);
      questions.push(...fallbackQuestions);
    }
    
    return questions;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return generateFallbackQuestions(expectedCount); // Return fallback questions on error
  }
}

/**
 * Generate fallback aviation questions if AI generation fails
 * @param {number} count - Number of questions to generate
 * @returns {Array} - Array of fallback question objects
 */
function generateFallbackQuestions(count) {
  console.log(`Generating ${count} fallback aviation questions`);
  
  const fallbackQuestions = [
    {
      id: 'fallback-1',
      text: 'What is the primary purpose of the ailerons on an aircraft?',
      options: [
        { id: 'A', text: 'Control pitch (nose up/down)' },
        { id: 'B', text: 'Control roll (bank left/right)' },
        { id: 'C', text: 'Control yaw (nose left/right)' },
        { id: 'D', text: 'Reduce landing speed' }
      ],
      correctOptionId: 'B',
      explanation: 'Ailerons control the roll of an aircraft by creating differential lift on the wings.'
    },
    {
      id: 'fallback-2',
      text: 'What does AGL stand for in aviation?',
      options: [
        { id: 'A', text: 'Above Ground Level' },
        { id: 'B', text: 'Actual Glide Length' },
        { id: 'C', text: 'Automated Guidance Logic' },
        { id: 'D', text: 'Auxiliary Gear Lever' }
      ],
      correctOptionId: 'A',
      explanation: 'AGL stands for Above Ground Level, which measures height relative to the terrain directly below the aircraft.'
    },
    {
      id: 'fallback-3',
      text: 'What is the purpose of a VOR in aviation navigation?',
      options: [
        { id: 'A', text: 'Visual flight reference' },
        { id: 'B', text: 'Variable oxygen regulator' },
        { id: 'C', text: 'VHF Omnidirectional Range' },
        { id: 'D', text: 'Vertical orientation radar' }
      ],
      correctOptionId: 'C',
      explanation: 'VOR (VHF Omnidirectional Range) is a ground-based navigation system that provides bearing information to aircraft.'
    }
    // Add more fallback questions as needed
  ];
  
  // Return the requested number of questions, cycling through the array if needed
  return Array.from({ length: count }, (_, i) => fallbackQuestions[i % fallbackQuestions.length]);
}

/**
 * Main function to generate questions from a document in Supabase storage
 * @param {string} filePath - Path to the file in Supabase storage
 * @param {Object} options - Options for question generation
 * @returns {Promise<Array>} - Array of generated questions
 */
export const generateQuestions = async (filePath, options = {}) => {
  try {
    console.log('Starting question generation for file:', filePath);
    
    // Extract document text
    const documentText = await extractTextFromDocument(filePath);
    
    // Set default options
    const questionOptions = {
      questionCount: 10,
      difficulty: 'mixed',
      ...options
    };
    
    // Generate questions with Claude AI
    const questions = await generateQuestionsWithClaude(
      documentText, 
      questionOptions.questionCount
    );
    
    console.log(`Successfully generated ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error('Question generation error:', error);
    
    // Return fallback questions on error
    const fallbackCount = options.questionCount || 10;
    console.log(`Returning ${fallbackCount} fallback questions due to error`);
    return generateFallbackQuestions(fallbackCount);
  }
};
