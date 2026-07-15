// src/utils/placeIndexUtils.test.js
import { describe, it, expect } from 'vitest';
import { computeStats, validatePlaces, dedupeByContentId, refreshPlaceCache } from './placeIndexUtils';

const sample = [
  { contentid: '1', title: 'A', category: '관광지', region: '노원구' },
  { contentid: '2', title: 'B', category: '문화시설', region: '강남구' },
  { contentid: '1', title: 'A(dup)', category: '관광지', region: '노원구' },
  { contentid: '', title: '', category: '쇼핑', region: '' }
];

describe('placeIndexUtils', () => {
  it('computeStats calculates totals and buckets', () => {
    const stats = computeStats(sample);
    expect(stats.total).toBe(4);
    expect(stats.byCategory['관광지']).toBe(2);
    expect(stats.byRegion['노원구']).toBe(2);
  });

  it('validatePlaces finds missing fields and duplicates', () => {
    const { missing, duplicates } = validatePlaces(sample);
    expect(missing.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(duplicates)).toContain('1');
    expect(duplicates['1'].length).toBe(2);
  });

  it('dedupeByContentId removes duplicates keeping first', () => {
    const deduped = dedupeByContentId(sample);
    expect(deduped.find(p => p.contentid === '1').title).toBe('A');
    expect(deduped.length).toBe(3); // one duplicate removed
  });

  it('refreshPlaceCache calls buildFn and saveFn', async () => {
    const fakeBuild = async () => sample;
    let saved = null;
    const fakeSave = (arr) => { saved = arr; };
    const result = await refreshPlaceCache(fakeBuild, fakeSave);
    expect(Array.isArray(result)).toBe(true);
    expect(saved).not.toBeNull();
    expect(saved.length).toBe(result.length);
  });
});