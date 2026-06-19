export const getChallengeId = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return item._id || item;
};

export const isChallengeSolved = (solvedChallenges, challengeId) => {
  if (!solvedChallenges?.length || !challengeId) return false;
  const id = challengeId.toString();
  return solvedChallenges.some(s => getChallengeId(s)?.toString() === id);
};

export const getSolvedCount = (solvedChallenges) => solvedChallenges?.length || 0;

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
