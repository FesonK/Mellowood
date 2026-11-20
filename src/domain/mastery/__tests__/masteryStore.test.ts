import { loadMastery, saveMastery } from '../masteryStore';
import { MemoryRepository } from '@/data/memoryRepository';

describe('masteryStore', () => {
  it('saves and loads mastery per concept, merging with existing values', async () => {
    const repo = new MemoryRepository();
    await saveMastery(repo, 'u1', { 'basics/variables': 0.8 });
    await saveMastery(repo, 'u1', { 'basics/loops': 0.4 });
    expect(await loadMastery(repo, 'u1')).toEqual({ 'basics/variables': 0.8, 'basics/loops': 0.4 });
  });

  it('clamps values into 0..1', async () => {
    const repo = new MemoryRepository();
    await saveMastery(repo, 'u1', { a: 3, b: -1 });
    expect(await loadMastery(repo, 'u1')).toEqual({ a: 1, b: 0 });
  });
});
