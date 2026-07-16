// src/composables/useChatbot.js
import { ref } from 'vue';

const CHAT_KEY = 'localhub_chat_history';
const POSTS_KEY = 'localhub_posts';
const PLACE_FILES = [
  '/data/서울/서울_관광지.json',
  '/data/서울/서울_문화시설.json',
  '/data/서울/서울_레포츠.json',
  '/data/서울/서울_쇼핑.json'
];

export function useChatbot() {
  const loading = ref(false);
  const error = ref(null);
  const messages = ref([]);
  const placeIndex = ref([]); // PlaceLite[]
  const smalltalkTemplates = {
    greeting: ['안녕하세요! 어디로 나들이 가볼까요?', '반가워요! 지역이나 카테고리를 알려주세요.'],
    lunch: ['오늘은 한식 어때요? 근처 맛집을 찾아드릴게요.', '가벼운 외식이면 카페나 분식도 좋아요. 원하시면 검색해볼게요.'],
    fallback: ['그 부분은 자세히 알기 어려워요. 대신 장소 추천을 도와드릴게요.']
  };

  function loadChatHistory() {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      messages.value = raw ? JSON.parse(raw) : [
        { role: 'system', content: "너는 서울 지역의 나들이 장소를 추천해주는 'LocalHub'의 친절한 AI 가이드야. 한국어로 답해." }
      ];
    } catch (e) {
      messages.value = [{ role: 'system', content: "너는 서울 지역의 나들이 장소를 추천해주는 'LocalHub'의 친절한 AI 가이드야. 한국어로 답해." }];
    }
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.value));
    } catch (e) {
      console.error('saveChatHistory error', e);
    }
  }

  async function loadPlaceLite() {
    const index = [];
    await Promise.all(PLACE_FILES.map(async (p) => {
      try {
        const res = await fetch(p);
        if (!res.ok) return;
        const json = await res.json();
        const items = json.items || [];
        items.forEach(it => {
          index.push({
            contentid: it.contentid || it.contentId || '',
            title: it.title || '',
            address: it.addr1 || '',
            category: mapContentTypeIdToCategory(it.contenttypeid || it.contentTypeId || json.contentTypeId),
            mapx: it.mapx || '',
            mapy: it.mapy || '',
            region: inferRegionFromAddress(it.addr1 || '')
          });
        });
      } catch (e) {
        console.warn('loadPlaceLite fetch error', p, e);
      }
    }));
    placeIndex.value = index;
    return index;
  }

  function mapContentTypeIdToCategory(id) {
    const map = { '12': '관광지', '14': '문화시설', '28': '레포츠', '38': '쇼핑' };
    return map[String(id)] || '기타';
  }

  function inferRegionFromAddress(addr) {
    if (!addr) return '';
    const m = addr.match(/서울특별시\s*([^ ]+구)/);
    return m ? m[1] : '';
  }

  function normalizeText(s='') {
    return String(s).toLowerCase();
  }

  function searchPlaces({ region, category, keyword } = {}, limit = 5) {
    const qRegion = normalizeText(region || '');
    const qCat = normalizeText(category || '');
    const qKey = normalizeText(keyword || '');
    const results = placeIndex.value.filter(p => {
      const matchesRegion = qRegion ? normalizeText(p.region).includes(qRegion) : true;
      const matchesCat = qCat ? normalizeText(p.category).includes(qCat) : true;
      const matchesKey = qKey ? (normalizeText(p.title).includes(qKey) || normalizeText(p.address).includes(qKey)) : true;
      return matchesRegion && matchesCat && matchesKey;
    }).slice(0, limit);
    return results;
  }

  function searchPosts(query = '', limit = 5) {
    try {
      const raw = localStorage.getItem(POSTS_KEY);
      const posts = raw ? JSON.parse(raw) : [];
      const q = normalizeText(query);
      return posts.filter(p => {
        return normalizeText(p.title).includes(q)
          || normalizeText(p.content).includes(q)
          || (p.placeInfo && (normalizeText(p.placeInfo.title || '').includes(q) || normalizeText(p.placeInfo.contentid || '').includes(q)));
      }).slice(0, limit);
    } catch (e) {
      console.error('searchPosts', e);
      return [];
    }
  }

  function classifyIntent(text) {
    const t = normalizeText(text);
    if (/안녕|hello|안녕하세요|하이/.test(t)) return 'greeting';
    if (/점심|뭐 먹을까|점심 뭐|식사/.test(t)) return 'lunch';
    if (/날씨/.test(t)) return 'weather';
    if (/구|시|근처|추천|어디/.test(t)) return 'place_search';
    return 'smalltalk';
  }

  function smalltalkReply(text) {
    const intent = classifyIntent(text);
    if (intent === 'greeting') return pickOne(smalltalkTemplates.greeting);
    if (intent === 'lunch') return pickOne(smalltalkTemplates.lunch);
    return pickOne(smalltalkTemplates.fallback);
  }

  function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async function sendToOpenAI(userMessage, contextMessages = []) {
    loading.value = true;
    error.value = null;
    try {
      const openAIKey = (() => {
        try {
          return import.meta && import.meta.env && import.meta.env.VITE_OPENAI_KEY;
        } catch (e) {
          return undefined;
        }
      })();

      if (!openAIKey) {
        error.value = 'OpenAI key not set';
        return null;
      }
      const systemMsg = messages.value.find(m => m.role === 'system') || { role: 'system', content: "너는 서울 지역 가이드다." };
      const payloadMessages = [systemMsg, ...contextMessages, { role: 'user', content: userMessage }];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: payloadMessages,
          max_tokens: 600,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`OpenAI error: ${res.status} ${txt}`);
      }
      const j = await res.json();
      const assistant = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
      const assistantMsg = { role: 'assistant', content: assistant };

      // push only assistant message here (do not duplicate user)
      messages.value.push(assistantMsg);
      saveChatHistory();
      return assistant;
    } catch (e) {
      console.error('sendToOpenAI', e);
      error.value = e.message || String(e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function pushLocalAssistant(text, userText = '') {
    if (userText) messages.value.push({ role: 'user', content: userText });
    messages.value.push({ role: 'assistant', content: text });
    saveChatHistory();
  }

  // explicit initializer (call from component or tests)
  async function init() {
    loadChatHistory();
    await loadPlaceLite();
  }

  return {
    loading,
    error,
    messages,
    placeIndex,
    loadPlaceLite,
    searchPlaces,
    searchPosts,
    classifyIntent,
    smalltalkReply,
    sendToOpenAI,
    saveChatHistory,
    init,
    pushLocalAssistant
  };
}