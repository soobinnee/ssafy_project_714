<template>
  <header class="app-header" role="banner">
    <div class="inner">
      <div class="brand">
        <router-link to="/" class="logo">LocalHub</router-link>
      </div>

      <nav class="nav" role="navigation" aria-label="주요 링크">
        <router-link :to="{ name: 'home' }">홈</router-link>
        <router-link :to="{ name: 'dashboard' }">대시보드</router-link>
        <router-link :to="{ name: 'board-list' }">게시판</router-link>
        <router-link :to="{ name: 'post-write' }">글쓰기</router-link>
      </nav>

      <div class="controls" role="region" aria-label="헤더 컨트롤">
        <label class="visually-hidden" for="region-select">지역 선택</label>
        <select
          id="region-select"
          v-model="selectedRegion"
          @change="saveRegion"
          aria-label="지역 선택"
        >
          <option value="">전체</option>
          <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
        </select>

        <button
          class="chat-btn"
          @click="toggleChat"
          :aria-pressed="showChat"
          :aria-label="showChat ? '챗봇 닫기' : '챗봇 열기'"
        >
          챗봇
        </button>

        <div class="meta" aria-live="polite">
          <span class="count">{{ postCount }}개 게시글</span>
        </div>
      </div>
    </div>

    <ChatbotWidget v-if="showChat" class="chatbot-widget" />
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ChatbotWidget from './ChatbotWidget.vue'

const router = useRouter()
const showChat = ref(false)
const selectedRegion = ref('')
const regions = ref([])

function getPostCount() {
  try {
    const raw = localStorage.getItem('localhub_posts')
    if (!raw) return 0
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.length : 0
  } catch (e) {
    console.error('getPostCount parse error:', e)
    return 0
  }
}

const postCount = ref(getPostCount())

function refreshPostCount() {
  postCount.value = getPostCount()
}

function loadRegions() {
  try {
    const set = new Set()

    const rawPlaces = localStorage.getItem('localhub_places_lite')
    if (rawPlaces) {
      const places = JSON.parse(rawPlaces)
      if (Array.isArray(places)) {
        places.forEach(p => {
          if (p.region) set.add(String(p.region).trim())
          else if (p.address) {
            const addr = String(p.address)
            const m1 = addr.match(/서울(?:특별시)?\s*([^구]+구)/)
            const m2 = addr.match(/([^구]+구)/)
            if (m1) set.add(m1[1].trim())
            else if (m2) set.add(m2[1].trim())
          }
        })
      }
    }

    const rawPosts = localStorage.getItem('localhub_posts')
    if (rawPosts) {
      const posts = JSON.parse(rawPosts)
      if (Array.isArray(posts)) {
        posts.forEach(p => {
          const r = p?.placeInfo?.region || p?.placeInfo?.regionName
          if (r) set.add(String(r).trim())
        })
      }
    }

    const arr = [...set].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'))
    regions.value = arr.length ? arr : ['종로구', '중구', '강남구', '영등포구', '노원구']
  } catch (e) {
    console.error('loadRegions error:', e)
    regions.value = ['종로구', '중구', '강남구', '영등포구', '노원구']
  }
}

function loadSavedRegion() {
  try {
    const raw = localStorage.getItem('localhub_settings')
    if (!raw) return
    const s = JSON.parse(raw)
    if (s?.defaultRegion) selectedRegion.value = s.defaultRegion
  } catch (e) {
    console.error('loadSavedRegion parse error:', e)
  }
}

function saveRegion() {
  try {
    const raw = localStorage.getItem('localhub_settings')
    const cur = raw ? JSON.parse(raw) : {}
    cur.defaultRegion = selectedRegion.value
    localStorage.setItem('localhub_settings', JSON.stringify(cur))
    // replace to avoid stacking history entries
    if (selectedRegion.value) router.replace({ path: '/', query: { region: selectedRegion.value } })
    else router.replace({ path: '/' })
    // notify other components in same tab/window
    window.dispatchEvent(new Event('localhub_settings_updated'))
  } catch (e) {
    console.error('saveRegion error:', e)
  }
}

function toggleChat() {
  showChat.value = !showChat.value
}

function onStorageEvent(e) {
  // storage event fires on other windows/tabs; check relevant keys
  if (!e) return
  if (e.key === 'localhub_posts') refreshPostCount()
  if (e.key === 'localhub_places_lite') loadRegions()
  if (e.key === 'localhub_settings') loadSavedRegion()
}

function onCustomPostsUpdate() {
  // other components should dispatch `localhub_posts_updated` in same tab after CRUD
  refreshPostCount()
  loadRegions()
}

onMounted(() => {
  loadRegions()
  loadSavedRegion()
  refreshPostCount()

  window.addEventListener('storage', onStorageEvent)
  window.addEventListener('localhub_posts_updated', onCustomPostsUpdate)
  window.addEventListener('localhub_places_updated', loadRegions)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorageEvent)
  window.removeEventListener('localhub_posts_updated', onCustomPostsUpdate)
  window.removeEventListener('localhub_places_updated', loadRegions)
})
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e6e6e6;
  padding: 10px 0;
}
.inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
}
.brand .logo {
  font-weight: 700;
  font-size: 1.1rem;
  color: #111827;
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 12px;
  flex: 1;
}
.nav a {
  color: #374151;
  text-decoration: none;
  padding: 6px 8px;
  border-radius: 4px;
}
.router-link-active {
  background: #f1f5f9;
  color: #0f172a;
}
.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
}
.chat-btn {
  background: #0ea5a4;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.chat-btn[aria-pressed="true"] {
  box-shadow: 0 0 0 3px rgba(14,165,164,0.12);
}
.meta .count {
  color: #6b7280;
  font-size: 0.9rem;
}
.chatbot-widget {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1200;
}
/* visually hidden helper */
.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap;
  border: 0;
  padding: 0;
  margin: -1px;
}
</style>