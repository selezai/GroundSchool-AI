import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import QuestionCard from '../components/QuestionCard';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import ScoreDisplay from '../components/ScoreDisplay';

const QuizScreen = ({ 
  questions = [], 
  onComplete = () => {},
  testID = 'quiz-screen'
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex] || { 
    id: 'empty', 
    question: 'No questions available', 
    options: [],
    correctAnswer: '',
    questionNumber: 1,
    questionText: 'No questions available',
    category: 'General',
    difficulty: 'Medium'
  };

  useEffect(() => {
    if (quizCompleted) {
      calculateScore();
      setShowResults(true);
      onComplete(score, selectedAnswers);
    }
  }, [quizCompleted]);

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };



  const calculateScore = () => {
    let correctCount = 0;
    
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);
  };

  const handleSubmitQuiz = () => {
    setQuizCompleted(true);
  };

  if (showResults) {
    return (
      <View style={styles.container} testID={`${testID}-results`}>
        <ScoreDisplay 
          score={score}
          totalQuestions={questions.length}
          correctAnswers={score * questions.length / 100}
          testID={`${testID}-score`}
        />
        <Button 
          title="Restart Quiz" 
          onPress={() => {
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowResults(false);
            setQuizCompleted(false);
            setScore(0);
          }}
          testID={`${testID}-restart`}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <ProgressBar 
          current={currentQuestionIndex + 1}
          total={questions.length || 1}
          testID={`${testID}-progress`}
        />
      </View>
      
      <ScrollView style={styles.content}>
        <QuestionCard
          questionNumber={currentQuestionIndex + 1}
          questionText={currentQuestion.question}
          category={currentQuestion.category || 'General'}
          difficulty={currentQuestion.difficulty || 'Medium'}
          testID={`${testID}-question`}
        />
        
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            title={option}
            onPress={() => handleAnswerSelect(currentQuestion.id, option)}
            testID={`${testID}-option-${index}`}
            style={selectedAnswers[currentQuestion.id] === option ? { backgroundColor: '#4299E1' } : {}}
          />
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Previous" 
          onPress={handlePreviousQuestion} 
          disabled={currentQuestionIndex === 0}
          testID={`${testID}-prev`}
        />
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            title="Next" 
            onPress={handleNextQuestion}
            testID={`${testID}-next`}
          />
        ) : (
          <Button 
            title="Submit" 
            onPress={handleSubmitQuiz}
            testID={`${testID}-submit`}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});

export default QuizScreen;
