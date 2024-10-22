export const isCorrectAnswer = (userGuess: string, correctAnswer: string | string[]): boolean => {
  const normalizedUserGuess = userGuess.toLowerCase().trim();
  
  // Parse the answer if it's a stringified array
  let answers: string[];
  if (typeof correctAnswer === 'string') {
    try {
      answers = JSON.parse(correctAnswer);
    } catch (e) {
      answers = [correctAnswer];
    }
  } else {
    answers = correctAnswer;
  }

  // Check against each possible answer
  return answers.some(answer => {
    const normalizedAnswer = answer.toLowerCase().trim();
    
    // Exact match
    if (normalizedUserGuess === normalizedAnswer) {
      return true;
    }
    
    const answerWords = normalizedAnswer.split(' ');
    const guessWords = normalizedUserGuess.split(' ');
    
    // Check abbreviation for multi-word answers
    if (answerWords.length > 1) {
      const abbrev = answerWords.map(word => word[0]).join('').toLowerCase();
      if (normalizedUserGuess === abbrev) {
        return true;
      }
      
      // For answers with 3 or more words, check if user got at least 2 words correct
      if (answerWords.length >= 3) {
        let correctWordCount = 0;
        
        // Count how many words from the guess appear in the answer
        guessWords.forEach(guessWord => {
          if (answerWords.some(answerWord => 
              answerWord.toLowerCase() === guessWord.toLowerCase())) {
            correctWordCount++;
          }
        });
        
        // Return true if user got 2 or more words correct
        if (correctWordCount >= 2) {
          return true;
        }
      }
    }
    
    return false;
  });
};