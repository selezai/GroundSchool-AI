import axios from 'axios';
import { supabase } from '../src/services/supabaseClient';
import { env } from '../src/utils/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // Using DeepSeek Chat model

/**
 * Extracts text content from a document stored in Supabase
 * @param {string} filePath - Path to the file in Supabase storage
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromDocument(filePath) {
  try {
    console.log('[DEBUG] Starting document extraction for:', filePath);
    console.log('[DEBUG] Supabase client available:', !!supabase);
    
    if (!filePath) {
      console.error('[ERROR] Invalid file path provided:', filePath);
      throw new Error('Invalid document path: empty or undefined');
    }
    
    // Log Supabase bucket access attempt
    console.log('[DEBUG] Attempting to access Supabase storage bucket: documents');
    
    // Get file from Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);
      
    if (error) {
      console.error('[ERROR] Failed to download document:', error);
      console.error('[ERROR] Document path:', filePath);
      throw error;
    }
    
    if (!data) {
      console.error('[ERROR] Document download returned no data');
      throw new Error('Document download returned empty data');
    }
    
    console.log('[DEBUG] Document download successful, file type:', data.type);
    console.log('[DEBUG] Document size:', data.size, 'bytes');
    
    // Convert blob to text
    const text = await data.text();
    
    // Log document content statistics
    const contentPreview = text.substring(0, 100).replace(/\n/g, ' ');
    console.log(`[SUCCESS] Extracted ${text.length} characters from document`);
    console.log(`[DEBUG] Document content preview: "${contentPreview}..."`);
    
    if (text.length < 50) {
      console.warn('[WARN] Extracted document text is suspiciously short!');
    }
    
    return text;
  } catch (error) {
    console.error('[FATAL] Document extraction failed:', error);
    console.error('[STACK] Error stack:', error.stack);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Generate aviation-specific questions using DeepSeek AI based on document content
 * @param {string} documentText - Text content of the document
 * @param {number} questionCount - Number of questions to generate (default: 10)
 * @returns {Promise<Array>} - Array of generated questions
 */
async function generateQuestionsWithDeepSeek(documentText, questionCount = 10) {
  try {
    console.log(`Generating ${questionCount} questions with DeepSeek AI`);
    
    // Import the API client
    const apiClient = require('../src/services/apiClient').default;
    
    // Use the API client to generate questions
    const result = await apiClient.generateQuestionsWithDeepSeek(documentText, {
      questionCount: questionCount
    });
    
    console.log('Successfully received response from DeepSeek');
    
    // Process the response into structured question format
    return parseQuestionsFromAIResponse(result.rawResponse, questionCount);
  } catch (error) {
    console.error('DeepSeek AI error:', error.message);
    throw new Error(`Failed to generate questions with AI: ${error.message}`);
  }
}

/**
 * Parse DeepSeek's text response into structured question objects
 * @param {string} aiResponse - Raw text response from DeepSeek
 * @param {number} expectedCount - Expected number of questions
 * @returns {Array} - Array of structured question objects
 */
function parseQuestionsFromAIResponse(aiResponse, expectedCount) {
  try {
    console.log('Parsing DeepSeek response into structured questions');
    
    // Log the start of the response for debugging
    console.log('Response starts with:', aiResponse.substring(0, 100) + '...');
    
    // Enhanced response parsing with multiple formats support
    let questionBlocks;
    
    // Try different splitting patterns based on how DeepSeek formats questions
    // Pattern 1: Questions prefixed with '### Question X:' (typical DeepSeek format)
    if (aiResponse.includes('### Question')) {
      console.log('Detected DeepSeek markdown format with ### Question headers');
      questionBlocks = aiResponse.split(/###\s*Question\s*\d+[:.\s]+/).filter(block => block.trim().length > 0);
    }
    // Pattern 2: Questions separated by numbered patterns like '1.' or simple dash blocks
    else if (aiResponse.match(/\n\s*\d+\.\s+/)) {
      console.log('Detected numbered list format');
      questionBlocks = aiResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
    }
    // Pattern 3: Questions separated by '---' markdown dividers
    else if (aiResponse.includes('---')) {
      console.log('Detected markdown divider format');
      questionBlocks = aiResponse.split(/\n\s*---\s*\n/).filter(block => block.trim().length > 0);
    }
    // Fallback: Try to split by double newline and look for question patterns
    else {
      console.log('Using fallback question parsing logic');
      questionBlocks = aiResponse.split(/\n\n+/).filter(block => {
        return block.includes('?') && block.includes('Correct Answer') || block.includes('Answer:');
      });
    }
    
    console.log(`Identified ${questionBlocks.length} potential question blocks`);
    
    const questions = [];
    
    questionBlocks.forEach((block, index) => {
      try {
        // Extract question text (everything before options start)
        // Try multiple patterns for question extraction
        let questionText = '';
        
        // First try to get text before the first option
        const questionMatch = block.match(/([\s\S]+?)\n\s*[A-D][.):]\s+/s) || 
                            block.match(/\*\*([^*]+)\*\*/); // Look for bolded question in markdown
                            
        if (questionMatch) {
          questionText = questionMatch[1].trim();
        } else if (block.includes('?')) {
          // Try to extract first sentence ending with question mark
          const questionMarkMatch = block.match(/([^.!?]+\?)/); 
          if (questionMarkMatch) {
            questionText = questionMarkMatch[1].trim();
          }
        }
        
        // Remove any markdown formatting from question text
        questionText = questionText.replace(/\*\*/g, '').trim();
        
        // Enhanced option extraction that handles multiple formats
        const optionsRegex = /\b([A-D])[.):]\s*([^\n]+)/g;
        const options = [];
        let match;
        
        while ((match = optionsRegex.exec(block)) !== null) {
          options.push({
            id: match[1], // A, B, C, or D
            text: match[2].trim()
          });
        }
        
        // Extract correct answer with enhanced pattern matching
        const correctAnswerMatch = block.match(/Correct [Aa]nswer\s*[:.]+\s*([A-D])/i) || 
                                  block.match(/Answer\s*[:.]+\s*([A-D])/i) ||
                                  block.match(/\*\*Correct [Aa]nswer[:.]*\*\*\s*([A-D])/i);
                                  
        const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : '';
        
        // Enhanced explanation extraction
        const explanationMatch = block.match(/Explanation\s*[:.]+\s*([\s\S]+?)(?=\n\s*\d|\n\s*---|$)/is) ||
                                block.match(/\*\*Explanation\*\*\s*[:.]*\s*([\s\S]+?)(?=\n\s*\d|\n\s*---|$)/is);
                                
        const explanation = explanationMatch ? explanationMatch[1].trim() : '';
        
        console.log(`Question ${index + 1} parsing result:`, {
          hasText: !!questionText,
          optionsCount: options.length,
          hasCorrectAnswer: !!correctAnswer,
          hasExplanation: !!explanation
        });
        
        // Only add well-formed questions
        if (questionText && options.length >= 3 && correctAnswer) {
          questions.push({
            id: `q-${Date.now()}-${index}`,
            text: questionText,
            options: options,
            correctOptionId: correctAnswer,
            explanation: explanation
          });
        } else {
          console.warn(`Skipping malformed question ${index + 1}:`, {
            textLength: questionText?.length || 0,
            optionsCount: options.length,
            correctAnswer
          });
        }
      } catch (parseError) {
        console.warn(`Error parsing question block ${index}:`, parseError);
        // Continue with other questions
      }
    });
    
    console.log(`Successfully parsed ${questions.length} questions`);
    
    // Updated fallback handling - better to return fewer specific questions than pad with generic ones
    if (questions.length < expectedCount) {
      const missingCount = expectedCount - questions.length;
      
      // If we have at least 3 good questions, just return those instead of adding fallbacks
      if (questions.length >= 3) {
        console.log(`Generated ${questions.length} document-specific questions. Using these instead of adding fallbacks.`);
      } else {
        // Only use fallbacks if we have fewer than 3 valid questions
        console.warn(`Only parsed ${questions.length} questions, adding ${missingCount} fallback questions as a last resort`);
        const fallbackQuestions = generateFallbackQuestions(missingCount);
        questions.push(...fallbackQuestions);
      }
    }
    
    return questions;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Attempt to retry parsing with more lenient methods before falling back
    try {
      console.log('Attempting emergency parsing of AI response...');
      const lastDitchQuestions = emergencyParseResponse(aiResponse, expectedCount);
      
      if (lastDitchQuestions.length > 0) {
        console.log(`Emergency parsing found ${lastDitchQuestions.length} questions`);
        return lastDitchQuestions;
      }
    } catch (emergencyError) {
      console.error('Emergency parsing also failed:', emergencyError);
    }
    
    // Only use fallbacks as a true last resort
    console.error('All parsing attempts failed, returning fallback questions');
    return generateFallbackQuestions(expectedCount);
  }
}

/**
 * Emergency parsing function to extract questions when normal parsing fails
 * Uses a more lenient approach to find any possible questions in the response
 * @param {string} aiResponse - Raw text response from DeepSeek
 * @param {number} expectedCount - Expected number of questions
 * @returns {Array} - Array of structured question objects
 */
function emergencyParseResponse(aiResponse, expectedCount) {
  try {
    console.log('Attempting last-chance parsing of questions...');
    const questions = [];
    
    // Look for question patterns - even incomplete ones
    const questionPatterns = [
      // Look for lines ending with question marks
      /([^?\n]+\?)/g,
      // Look for numbered questions
      /(Question\s*\d+[:.\s]+[^\n]+)/gi
    ];
    
    // Attempt to find any question-like text
    let potentialQuestions = [];
    questionPatterns.forEach(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        potentialQuestions = [...potentialQuestions, ...matches];
      }
    });
    
    console.log(`Found ${potentialQuestions.length} potential questions in emergency mode`);
    
    // Find option patterns
    const optionRegex = /([A-D])[.):] ([^\n]+)/g;
    
    // Create questions from whatever we can find
    potentialQuestions.forEach((questionText, index) => {
      // Find the part of the response that might contain this question and its options
      const startIndex = aiResponse.indexOf(questionText);
      if (startIndex === -1) return;
      
      // Get a chunk of text that might contain options (300 chars after question)
      const chunk = aiResponse.substring(startIndex, startIndex + 300);
      
      // Try to extract options
      const options = [];
      let match;
      const localOptionRegex = new RegExp(optionRegex);
      
      while ((match = localOptionRegex.exec(chunk)) !== null) {
        options.push({
          id: match[1],
          text: match[2].trim()
        });
      }
      
      // Only proceed if we found at least 3 options
      if (options.length >= 3) {
        // Try to find correct answer - fallback to first option if not found
        const correctAnswerMatch = chunk.match(/correct answer[s:]*\s*([A-D])/i) ||
                                 chunk.match(/answer[s:]*\s*([A-D])/i);
        const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : options[0].id;
        
        // Add the question
        questions.push({
          id: `emergency-${Date.now()}-${index}`,
          text: questionText.replace(/^Question\s*\d+[:.\s]+/i, '').trim(),
          options: options,
          correctOptionId: correctAnswer,
          explanation: 'This question was extracted from the document content.'
        });
      }
    });
    
    console.log(`Emergency parsing recovered ${questions.length} questions with options`);
    return questions;
  } catch (error) {
    console.error('Emergency parsing error:', error);
    return [];
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
  console.log('┌─────────────────────────────────────────────────');
  console.log('│ 🚀 QUESTION GENERATION PROCESS STARTED');
  console.log('│ Document:', filePath);
  console.log('│ Options:', JSON.stringify(options));
  console.log('└─────────────────────────────────────────────────');
  
  try {
    // Extract document text with detailed error tracking
    console.log('[STEP 1] Extracting document text');
    let documentText;
    try {
      documentText = await extractTextFromDocument(filePath);
      if (!documentText || documentText.length < 100) {
        console.error('[ERROR] Document text is too short or empty:', documentText?.length || 0, 'chars');
        throw new Error('Document text is too short to generate meaningful questions');
      }
      console.log('[SUCCESS] Document text extracted successfully:', documentText.length, 'chars');
    } catch (extractError) {
      console.error('[FATAL] Document extraction failed:', extractError);
      throw new Error(`Document extraction failed: ${extractError.message}`);
    }
    
    // Set default options with better logging
    const questionOptions = {
      questionCount: 10,
      difficulty: 'mixed',
      ...options
    };
    console.log('[INFO] Using question options:', JSON.stringify(questionOptions));
    
    // Generate questions with DeepSeek AI
    console.log('[STEP 2] Generating questions with DeepSeek');
    try {
      const questions = await generateQuestionsWithDeepSeek(
        documentText, 
        questionOptions.questionCount
      );
      
      console.log('[SUCCESS] Generated', questions.length, 'questions');
      
      if (questions.every(q => q.id.startsWith('fallback'))) {
        console.error('[ERROR] All questions are fallbacks, DeepSeek failed to produce document-specific questions');
      } else if (questions.some(q => q.id.startsWith('fallback'))) {
        console.warn('[WARN] Some questions are fallbacks, DeepSeek partially succeeded');
      } else {
        console.log('[SUCCESS] All questions are document-specific!');
      }
      
      return questions;
    } catch (aiError) {
      console.error('[ERROR] DeepSeek API failed:', aiError);
      throw new Error(`DeepSeek question generation failed: ${aiError.message}`);
    }
  } catch (error) {
    console.error('┌─────────────────────────────────────────────────');
    console.error('│ ❌ QUESTION GENERATION FAILED');
    console.error('│ Error:', error.message);
    console.error('│ Stack:', error.stack);
    console.error('└─────────────────────────────────────────────────');
    
    // Return fallback questions on error, but with better logging
    const fallbackCount = options.questionCount || 10;
    console.warn(`[FALLBACK] Returning ${fallbackCount} generic fallback questions due to error`);
    return generateFallbackQuestions(fallbackCount);
  }
};
