// src/composables/useChatbot.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatbot } from './useChatbot';

// simple localStorage mock for Vitest (node)
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => (store[k] = String(v)),
    removeItem: (k) => delete store[k],
    clear: () => (store = {})
  };
})();

describe('useChatbot basic functions', () => {
  let bot;
  beforeEach(() => {
    bot = useChatbot();
    // ensure clean storage
    localStorage.removeItem('localhub_chat_history');
    localStorage.removeItem('localhub_posts');

    // seed placeIndex for searchPlaces tests (avoid network)
    bot.placeIndex.value = [
      { contentid: '1', title: '노원기차마을', address: '서울특별시 노원구 화랑로', category: '문화시설', region: '노원구' },
      { contentid: '2', title: '양화한강공원', address: '서울특별시 영등포구 노들로', category: '관광지', region: '영등포구' }
    ];

    // seed posts
    const posts = [
      { id: 100, title: '노원기차마을 후기', content: '아이들이 좋아했어요', placeInfo: { contentid: '1', title: '노원기차마을' } }
    ];
    localStorage.setItem('localhub_posts', JSON.stringify(posts));
  });

  it('classifyIntent detects greeting and place_search', () => {
    expect(bot.classifyIntent('안녕')).toBe('greeting');
    expect(bot.classifyIntent('노원구에 추천해줘')).toBe('place_search');
  });

  it('smalltalkReply returns canned reply', () => {
    const r = bot.smalltalkReply('안녕');
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  it('searchPlaces finds items by region and category', () => {
    const res = bot.searchPlaces({ region: '노원구', category: '문화시설' }, 5);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].title).toContain('노원기차마을');
  });

  it('searchPosts finds seeded post by keyword', () => {
    const res = bot.searchPosts('기차', 5);
    expect(res.length).toBe(1);
    expect(res[0].title).toContain('노원기차마을');
  });
});