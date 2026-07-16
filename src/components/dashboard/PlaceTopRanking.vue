<template>
  <div class="place-top-ranking">
    <div class="header">
      <h4>{{ title }}</h4>
      <button class="refresh" @click="rebuild">새로고침</button>
    </div>

    <ul v-if="items.length" class="list">
      <li v-for="(p, idx) in items" :key="p.contentid" class="item">
        <div class="rank">{{ idx + 1 }}</div>
        <router-link
          class="meta"
          :to="{ name: 'place-detail', params: { category: p.category, contentid: p.contentid } }"
        >
          <div class="title">{{ p.title }}</div>
          <div class="sub">
            <span class="category">{{ p.category }}</span>
            <span class="region">{{ p.gu || '정보없음' }}</span>
          </div>
        </router-link>
        <div class="stats">
          <span class="likes">❤️ {{ p.likeCount }}</span>
          <span class="comments">💬 {{ p.commentCount }}</span>
        </div>
      </li>
    </ul>

    <div v-else-if="loading" class="empty">불러오는 중...</div>
    <div v-else class="empty">데이터가 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLikeCount } from '@/composables/usePlaceLikes'
import { getComments } from '@/composables/useComments'

const props = defineProps({
  title: {
    type: String,
    default: '인기 명소'
  },
  limit: {
    type: Number,
    default: 5
  },
  sortBy: {
    type: String,
    default: 'likes', // 'likes' | 'comments'
    validator: (v) => ['likes', 'comments'].includes(v)
  }
})

const CATEGORY_FILES = {
  '관광지': '/data/서울/서울_관광지.json',
  '문화시설': '/data/서울/서울_문화시설.json',
  '레포츠': '/data/서울/서울_레포츠.json',
  '쇼핑': '/data/서울/서울_쇼핑.json'
}

const GU_LIST = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]

function extractGu(addr1) {
  if (!addr1) return null
  return GU_LIST.find(gu => addr1.includes(gu)) || null
}

// PlaceDetailView.vue와 동일한 방식으로 댓글 키 계산 (사용자 게시글 댓글과 충돌 방지)
function commentKeyOf(contentid) {
  const n = Number(contentid)
  return Number.isFinite(n) ? 900000000000 + n : 0
}

const loading = ref(true)
const items = ref([])

async function loadAllPlaces() {
  const entries = Object.entries(CATEGORY_FILES)
  const results = await Promise.all(
    entries.map(([cat, url]) => fetch(url).then(r => r.json()).then(data => ({ cat, data })))
  )
  const merged = []
  results.forEach(({ cat, data }) => {
    (data.items || []).forEach(item => {
      merged.push({
        contentid: item.contentid,
        title: item.title,
        category: cat,
        gu: extractGu(item.addr1),
        likeCount: getLikeCount(item.contentid),
        commentCount: getComments(commentKeyOf(item.contentid)).length
      })
    })
  })
  return merged
}

async function rebuild() {
  loading.value = true
  try {
    const all = await loadAllPlaces()
    const sortKey = props.sortBy === 'comments' ? 'commentCount' : 'likeCount'
    items.value = [...all]
      .sort((a, b) => b[sortKey] - a[sortKey])
      .filter(p => p[sortKey] > 0)
      .slice(0, props.limit)
  } finally {
    loading.value = false
  }
}

onMounted(rebuild)
</script>

<style scoped>
.place-top-ranking {
  background:#fff;
  border-radius:8px;
  padding:12px;
  border:1px solid #eef2f6;
}
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.header h4 { margin:0; font-size:15px; }
.refresh { background:transparent; border:none; color:#2b6cb0; cursor:pointer; font-size:13px; }

.list { list-style:none; padding:0; margin:0; }
.item {
  display:flex;
  align-items:center;
  gap:10px;
  padding:8px;
  border-radius:6px;
}
.item + .item { margin-top:6px; border-top:1px dashed #f0f2f5; padding-top:10px; }
.rank { width:28px; text-align:center; font-weight:700; color:#334155; flex-shrink:0; }
.meta { flex:1; min-width:0; text-decoration:none; color:inherit; }
.title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#1f2937; }
.item:hover .title { text-decoration:underline; }
.sub { font-size:12px; color:#64748b; margin-top:4px; }
.stats { font-size:13px; color:#475569; display:flex; gap:8px; align-items:center; flex-shrink:0; }
.empty { color:#888; text-align:center; padding:16px 0; font-size:14px; }
</style>