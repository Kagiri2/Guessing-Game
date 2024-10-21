import { useState, useCallback } from 'react';

type MatchResult = {
  isCorrect: boolean;
  matchQuality: number;
};

export const useAnswerMatcher = () => {
  const [matchResult, setMatchResult] = useState<MatchResult>({ isCorrect: false, matchQuality: 0 });

  const checkAnswer = useCallback((userGuess: string, correctAnswer: string | string[]): void => {
    const normalizeString = (str: string): string => {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const checkAbbreviation = (guess: string, answer: string): boolean => {
      const guessChars = guess.split('');
      let answerIndex = 0;
      for (const char of guessChars) {
        answerIndex = answer.indexOf(char, answerIndex);
        if (answerIndex === -1) return false;
        answerIndex++;
      }
      return true;
    };

    const checkPartialMatch = (guess: string, answer: string): boolean => {
      const answerWords = answer.split(' ');
      return answerWords.some(word => normalizeString(word) === normalizeString(guess));
    };

    const normalizedGuess = normalizeString(userGuess);
    
    let isCorrect = false;
    let matchQuality = 0;

    const checkSingleAnswer = (answer: string) => {
      const normalizedAnswer = normalizeString(answer);
      
      // Check for exact match
      if (normalizedGuess === normalizedAnswer) {
        isCorrect = true;
        matchQuality = 1;
        return;
      }
      
      // Check for abbreviation
      if (checkAbbreviation(normalizedGuess, normalizedAnswer)) {
        isCorrect = true;
        matchQuality = 0.9;
        return;
      }
      
      // Check for partial match in multi-word answers
      if (answer.includes(' ') && checkPartialMatch(normalizedGuess, answer)) {
        isCorrect = true;
        matchQuality = 0.8;
        return;
      }
    };

    if (Array.isArray(correctAnswer)) {
      correctAnswer.forEach(checkSingleAnswer);
    } else {
      checkSingleAnswer(correctAnswer);
    }

    setMatchResult({ isCorrect, matchQuality });
  }, []);

  return { matchResult, checkAnswer };
};