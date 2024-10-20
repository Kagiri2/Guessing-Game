import { useState, useCallback, useEffect } from 'react';

export const usePointCalculator = (timeLimit: number) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [points, setPoints] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit]);

  useEffect(() => {
    const calculatedPoints = Math.max(
      3,
      Math.min(10, Math.round((timeRemaining / timeLimit) * 7 + 3))
    );
    setPoints(calculatedPoints);
  }, [timeRemaining, timeLimit]);

  const calculateFinalPoints = useCallback((matchQuality: number) => {
    return Math.round(points * matchQuality);
  }, [points]);

  const resetTimer = useCallback(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  return { points, calculateFinalPoints, resetTimer, timeRemaining };
};