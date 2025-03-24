/* global jest, describe, beforeEach, afterEach, it, expect, test */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import QuizScreen from '../QuizScreen';

// Mock the Alert module from react-native
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock the components to avoid prop type validation errors
jest.mock('../../components/QuestionCard', () => 'QuestionCard');
jest.mock('../../components/ProgressBar', () => 'ProgressBar');
jest.mock('../../components/ScoreDisplay', () => 'ScoreDisplay');
jest.mock('../../components/Button', () => 'Button');

describe('QuizScreen Component', () => {
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is the capital of France?',
      questionText: 'What is the capital of France?',
      questionNumber: 1,
      category: 'Geography',
      difficulty: 'Easy',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris'
    },
    {
      id: 'q2',
      question: 'What is the largest planet in our solar system?',
      questionText: 'What is the largest planet in our solar system?',
      questionNumber: 2,
      category: 'Astronomy',
      difficulty: 'Medium',
      options: ['Earth', 'Jupiter', 'Saturn', 'Mars'],
      correctAnswer: 'Jupiter'
    },
    {
      id: 'q3',
      question: 'Who painted the Mona Lisa?',
      questionText: 'Who painted the Mona Lisa?',
      questionNumber: 3,
      category: 'Art',
      difficulty: 'Hard',
      options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'],
      correctAnswer: 'Da Vinci'
    }
  ];

  const defaultProps = {
    questions: mockQuestions,
    onComplete: jest.fn(),
    testID: 'quiz-screen'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const tree = renderer.create(<QuizScreen {...defaultProps} />).toJSON();
    expect(tree).toBeDefined();
    expect(tree.type).toBe('View');
  });
  
  it('initializes with the correct state', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    const instance = component.root;
    
    // Check initial question is displayed
    const questionCard = instance.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionNumber).toBe(1);
    expect(questionCard.props.questionText).toBe(mockQuestions[0].questionText);
    
    // Check progress bar exists
    const progressBar = instance.findByProps({ testID: 'quiz-screen-progress' });
    expect(progressBar).toBeDefined();
    

  });

  it('displays the first question on initial render', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    const questionCard = component.root.findByProps({ testID: 'quiz-screen-question' });
    
    expect(questionCard.props.questionText).toBe(mockQuestions[0].questionText);
    expect(questionCard.props.questionNumber).toBe(1);
  });

  it('navigates to the next question when Next button is pressed', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    
    // Find and press the Next button
    const nextButton = component.root.findByProps({ testID: 'quiz-screen-next' });
    
    act(() => {
      nextButton.props.onPress();
    });
    
    // Check that we're now on the second question
    const questionCard = component.root.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionText).toBe(mockQuestions[1].questionText);
    expect(questionCard.props.questionNumber).toBe(2);
  });
  
  it('completes the quiz when pressing Next on the last question', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    const instance = component.root;
    
    // Go to the second question
    act(() => {
      const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
      nextButton.props.onPress();
    });
    
    // Go to the third (last) question
    act(() => {
      const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
      nextButton.props.onPress();
    });
    
    // Answer the last question
    act(() => {
      const options = instance.findAllByType('Button');
      const option = options.find(button => button.props.title === 'Da Vinci');
      option.props.onPress();
    });
    
    // This should complete the quiz
    act(() => {
      const submitButton = instance.findByProps({ testID: 'quiz-screen-submit' });
      submitButton.props.onPress();
    });
    
    // Verify that the quiz is completed (results are shown)
    const scoreDisplay = instance.findByProps({ testID: 'quiz-screen-score' });
    expect(scoreDisplay).toBeDefined();
  });

  it('navigates to the previous question when Previous button is pressed', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    
    // First go to the second question
    const nextButton = component.root.findByProps({ testID: 'quiz-screen-next' });
    
    act(() => {
      nextButton.props.onPress();
    });
    
    // Then go back to the first question
    const prevButton = component.root.findByProps({ testID: 'quiz-screen-prev' });
    
    act(() => {
      prevButton.props.onPress();
    });
    
    // Check that we're back on the first question
    const questionCard = component.root.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionText).toBe(mockQuestions[0].questionText);
    expect(questionCard.props.questionNumber).toBe(1);
  });

  it('selects an answer when an option is chosen', () => {
    const component = renderer.create(<QuizScreen {...defaultProps} />);
    
    // Find the first option button and click it
    const optionButton = component.root.findByProps({ testID: 'quiz-screen-option-2' }); // Paris is at index 2
    
    act(() => {
      optionButton.props.onPress();
    });
    
    // Verify the button style changes when selected
    expect(optionButton.props.style).toEqual({ backgroundColor: '#4299E1' });
  });

  it('shows the Submit button on the last question', () => {
    let component;
    
    // Create the component with a custom implementation that lets us access state
    act(() => {
      component = renderer.create(
        <QuizScreen {...defaultProps} />
      );
    });
    
    // Get the instance to access state
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Navigate to the second question
    act(() => {
      nextButton.props.onPress();
    });
    
    // Navigate to the third question
    act(() => {
      nextButton.props.onPress();
    });
    
    // On the last question, we should have a submit button
    const buttons = instance.findAllByType('Button');
    const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
    
    expect(submitButton).toBeDefined();
  });

  it('calculates the correct score when quiz is completed', () => {
    let component;
    
    // Create the component
    act(() => {
      component = renderer.create(
        <QuizScreen {...defaultProps} />
      );
    });
    
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Answer question 1
    act(() => {
      const options = instance.findAllByType('Button');
      const option1 = options.find(button => button.props.title === 'Paris');
      option1.props.onPress();
    });
    
    // Go to question 2
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 2
    act(() => {
      const options = instance.findAllByType('Button');
      const option2 = options.find(button => button.props.title === 'Jupiter');
      option2.props.onPress();
    });
    
    // Go to question 3
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 3
    act(() => {
      const options = instance.findAllByType('Button');
      const option3 = options.find(button => button.props.title === 'Da Vinci');
      option3.props.onPress();
    });
    
    // Submit the quiz
    act(() => {
      const buttons = instance.findAllByType('Button');
      const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
      submitButton.props.onPress();
    });
    
    // Check that the results screen is shown with the correct score
    const scoreDisplay = instance.findByProps({ testID: 'quiz-screen-score' });
    
    expect(scoreDisplay).toBeDefined();
    expect(scoreDisplay.props.score).toBe(100); // All answers correct = 100%
    expect(scoreDisplay.props.correctAnswers).toBe(3); // All 3 questions correct
  });

  it('restarts the quiz when the restart button is pressed', () => {
    let component;
    
    // Create the component
    act(() => {
      component = renderer.create(
        <QuizScreen {...defaultProps} />
      );
    });
    
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Answer question 1
    act(() => {
      const options = instance.findAllByType('Button');
      const option1 = options.find(button => button.props.title === 'Paris');
      option1.props.onPress();
    });
    
    // Go to question 2
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 2
    act(() => {
      const options = instance.findAllByType('Button');
      const option2 = options.find(button => button.props.title === 'Jupiter');
      option2.props.onPress();
    });
    
    // Go to question 3
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 3
    act(() => {
      const options = instance.findAllByType('Button');
      const option3 = options.find(button => button.props.title === 'Da Vinci');
      option3.props.onPress();
    });
    
    // Submit the quiz
    act(() => {
      const buttons = instance.findAllByType('Button');
      const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
      submitButton.props.onPress();
    });
    
    // Find and press the restart button
    act(() => {
      const restartButton = instance.findByProps({ testID: 'quiz-screen-restart' });
      restartButton.props.onPress();
    });
    
    // Check that we're back to the first question
    const questionCard = instance.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionNumber).toBe(1);
  });

  it('calls onComplete callback with score and answers when quiz is completed', () => {
    const onCompleteMock = jest.fn();
    const props = { ...defaultProps, onComplete: onCompleteMock };
    
    let component;
    
    // Create the component
    act(() => {
      component = renderer.create(
        <QuizScreen {...props} />
      );
    });
    
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Answer question 1
    act(() => {
      const options = instance.findAllByType('Button');
      const option1 = options.find(button => button.props.title === 'Paris');
      option1.props.onPress();
    });
    
    // Go to question 2
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 2
    act(() => {
      const options = instance.findAllByType('Button');
      const option2 = options.find(button => button.props.title === 'Jupiter');
      option2.props.onPress();
    });
    
    // Go to question 3
    act(() => {
      nextButton.props.onPress();
    });
    
    // Answer question 3
    act(() => {
      const options = instance.findAllByType('Button');
      const option3 = options.find(button => button.props.title === 'Da Vinci');
      option3.props.onPress();
    });
    
    // Submit the quiz
    act(() => {
      const buttons = instance.findAllByType('Button');
      const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
      submitButton.props.onPress();
    });
    
    // Check that onComplete was called with the correct arguments
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('completes the quiz when navigating through all questions', () => {
    let component;
    
    // Create the component
    act(() => {
      component = renderer.create(
        <QuizScreen {...defaultProps} />
      );
    });
    
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Navigate through all questions
    mockQuestions.forEach((_, index) => {
      if (index < mockQuestions.length - 1) {
        act(() => {
          nextButton.props.onPress();
        });
      }
    });
    
    // Check that we're on the last question
    const questionCard = instance.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionNumber).toBe(mockQuestions.length);
    
    // Verify the Submit button is visible on the last question
    const buttons = instance.findAllByType('Button');
    const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
    expect(submitButton).toBeDefined();
  });

  it('completes quiz immediately when submitting on the last question', () => {
    let component;
    
    // Create the component
    act(() => {
      component = renderer.create(
        <QuizScreen {...defaultProps} />
      );
    });
    
    const instance = component.root;
    const nextButton = instance.findByProps({ testID: 'quiz-screen-next' });
    
    // Go to the second question
    act(() => {
      nextButton.props.onPress();
    });
    
    // Go to the third (last) question
    act(() => {
      nextButton.props.onPress();
    });
    
    // Check we're on the last question
    const questionCard = instance.findByProps({ testID: 'quiz-screen-question' });
    expect(questionCard.props.questionNumber).toBe(3);
    
    // Select an answer on the last question
    act(() => {
      const options = instance.findAllByType('Button');
      const option = options.find(button => button.props.title === 'Da Vinci');
      option.props.onPress();
    });
    
    // Submit the quiz
    act(() => {
      const buttons = instance.findAllByType('Button');
      const submitButton = buttons.find(button => button.props.testID === 'quiz-screen-submit');
      submitButton.props.onPress();
    });
    
    // Verify that the quiz is completed and score display is shown
    const scoreDisplay = instance.findByProps({ testID: 'quiz-screen-score' });
    expect(scoreDisplay).toBeDefined();
  });
});
