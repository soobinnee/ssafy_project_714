<template>
  <header class="app-header" role="banner">
    <div class="inner">
      <div class="brand">
        <router-link to="/" class="logo">LocalHub</router-link>
      </div>

      <nav class="nav" role="navigation" aria-label="주요 링크">
        <a href="#" @click.prevent="navTo('home')">홈</a>
        <a href="#" @click.prevent="navTo('dashboard')">대시보드</a>
        <a href="#" @click.prevent="navTo('place-list')">게시판</a>
        <a href="#" @click.prevent="navTo('post-write')">글쓰기</a>
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

       
      </div>
    </div>

  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useChatbot } from '../../composables/useChatbot.js'

const router = useRouter()
const { isOpen: showChat, toggleChat } = useChatbot()
const selectedRegion = ref('')
const regions = ref([])




function loadRegions() {
  regions.value = [
    '강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구',
    '노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구',
    '성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'
  ]
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


function onStorageEvent(e) {
  // storage event fires on other windows/tabs; check relevant keys
  if (!e) return
  if (e.key === 'localhub_places_lite') loadRegions()
  if (e.key === 'localhub_settings') loadSavedRegion()
}

function onCustomPostsUpdate() {
  // 게시글 카운트 UI 제거로 인해 현재 특별 처리 없음.
}

function navTo(name) {
  const current = router.currentRoute.value?.name

  // 게시판(실제 명소 목록)으로 갈 때는 완전 새로고침으로 이동해서
  // 이전 카테고리/지역 필터 상태가 절대 남아있지 않도록 함
  if (name === 'place-list') {
    window.location.href = '/places'
    return
  }

  if (current === name) {
    router.replace({ name, query: { _r: Date.now() } }).catch(()=>{})
  } else {
    router.push({ name }).catch(()=>{})
  }
}

onMounted(() => {
  loadRegions()
  loadSavedRegion()
})

onBeforeUnmount(() => {
  // no-op: no post-related listeners to cleanup
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