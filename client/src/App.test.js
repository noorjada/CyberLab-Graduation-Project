import { isChallengeSolved, getChallengeId } from './utils/userUtils';

test('getChallengeId normalizes string and object ids', () => {
  expect(getChallengeId('abc')).toBe('abc');
  expect(getChallengeId({ _id: 'def' })).toBe('def');
});

test('isChallengeSolved works with mixed solved challenge formats', () => {
  const solved = ['abc123', { _id: 'def456', title: 'Test' }];
  expect(isChallengeSolved(solved, 'abc123')).toBe(true);
  expect(isChallengeSolved(solved, 'def456')).toBe(true);
  expect(isChallengeSolved(solved, 'missing')).toBe(false);
});
