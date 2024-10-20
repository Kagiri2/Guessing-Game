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

    const calculateSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      const longerLength = longer.length;
      if (longerLength === 0) {
        return 1.0;
      }
      return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
    };

    const editDistance = (str1: string, str2: string): number => {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
      const costs = [];
      for (let i = 0; i <= str1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= str2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) {
          costs[str2.length] = lastValue;
        }
      }
      return costs[str2.length];
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

    const normalizedGuess = normalizeString(userGuess);
    
    let isCorrect = false;
    let bestMatchQuality = 0;

    const checkSingleAnswer = (answer: string) => {
      const normalizedAnswer = normalizeString(answer);
      const similarity = calculateSimilarity(normalizedGuess, normalizedAnswer);
      const isAbbreviation = checkAbbreviation(normalizedGuess, normalizedAnswer);
      
      if (similarity > bestMatchQuality) {
        bestMatchQuality = similarity;
      }

      if (similarity > 0.8 || isAbbreviation) {
        isCorrect = true;
      }
    };

    if (Array.isArray(correctAnswer)) {
      correctAnswer.forEach(checkSingleAnswer);
    } else {
      checkSingleAnswer(correctAnswer);
    }

    setMatchResult({ isCorrect, matchQuality: bestMatchQuality });
  }, []);

  return { matchResult, checkAnswer };
};