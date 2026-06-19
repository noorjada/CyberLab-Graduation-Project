const gradeExam = (exam, answers, timeSpentSeconds = 0) => {
  const questions = exam.questions || [];
  let correctCount = 0;

  const results = questions.map((q, i) => {
    const selectedIndex = answers[i] ?? -1;
    const correct = selectedIndex === q.correctIndex;
    if (correct) correctCount++;

    return {
      questionIndex: i,
      question: q.question,
      selectedIndex,
      correctIndex: q.correctIndex,
      correct,
      explanation: q.explanation || '',
      topic: q.topic || 'General'
    };
  });

  const totalQuestions = questions.length;
  const score = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const passed = score >= (exam.passThreshold || 70);

  return {
    score,
    correctCount,
    totalQuestions,
    passed,
    timeSpentSeconds,
    results
  };
};

const publicQuestions = (questions) =>
  (questions || []).map((q, i) => ({
    index: i,
    question: q.question,
    options: q.options,
    topic: q.topic
  }));

module.exports = { gradeExam, publicQuestions };
