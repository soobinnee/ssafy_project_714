<template>
  <div class="place-list-view">
    <!-- 헤더 -->
    <div class="place-header">
      <h1 class="place-title" @click="handleTitleClick">{{ pageTitle }}</h1>
      <div class="place-count-badge">
        <div class="badge-value">{{ filteredPlaces.length }}</div>
        <div class="badge-label">전체 명소</div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="place-controls">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="명소 검색 (이름/주소)..."
      />
      <select v-model="categoryFilter" class="category-filter" @change="handleCategoryChange">
        <option value="">전체 카테고리</option>
        <option v-for="c in CATEGORY_LIST" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="selectedRegion" class="region-filter">
        <option value="">전체 지역</option>
        <option v-for="gu in GU_LIST" :key="gu" :value="gu">{{ gu }}</option>
      </select>
    </div>

    <!-- 명소 목록 -->
    <div class="place-content">
      <div v-if="loading" class="empty-state">
        <p>불러오는 중...</p>
      </div>
      <div v-else-if="paginatedPlaces.length > 0" class="places-container">
        <table class="place-table">
          <thead>
            <tr>
              <th class="col-number">번호</th>
              <th class="col-region">자치구</th>
              <th class="col-category">분류</th>
              <th class="col-title">명소명</th>
              <th class="col-likes">좋아요수</th>
              <th class="col-comments">댓글수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(place, index) in paginatedPlaces" :key="place.contentid || index">
              <td class="col-number">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="col-region">{{ place.gu || '정보없음' }}</td>
              <td class="col-category">{{ place.category }}</td>
              <td class="col-title">
                <router-link
                  :to="{
                    name: 'place-detail',
                    params: { category: place.category, contentid: place.contentid },
                    query: {
                      fromCategory: props.category || undefined,
                      fromRegion: selectedRegion || undefined,
                      fromPage: currentPage
                    }
                  }"
                  class="place-link"
                >
                  {{ place.title }}
                </router-link>
              </td>
              <td class="col-likes">{{ getLikeCount(place.contentid) }}</td>
              <td class="col-comments">{{ getCommentCount(place.contentid) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 페이지네이션 -->
        <PostPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @change="currentPage = $event"
        />
      </div>
      <div v-else class="empty-state">
        <p>해당하는 명소가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostPagination from '@/components/board/PostPagination.vue'
import { getLikeCount } from '@/composables/usePlaceLikes'
import { getComments } from '@/composables/useComments'

// PlaceDetailView.vue와 동일한 방식으로 댓글 키 계산 (사용자 게시글 댓글과 충돌 방지)
function getCommentCount(contentid) {
  const n = Number(contentid)
  const key = Number.isFinite(n) ? 900000000000 + n : 0
  return getComments(key).length
}

const props = defineProps({
  category: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const route = useRoute()

const CATEGORY_FILES = {
  '관광지': '/data/서울/서울_관광지.json',
  '문화시설': '/data/서울/서울_문화시설.json',
  '레포츠': '/data/서울/서울_레포츠.json',
  '쇼핑': '/data/서울/서울_쇼핑.json'
}
const CATEGORY_LIST = Object.keys(CATEGORY_FILES)

const GU_LIST = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]

function extractGu(addr1) {
  if (!addr1) return null
  return GU_LIST.find(gu => addr1.includes(gu)) || null
}

const loading = ref(true)
const allPlaces = ref([])
const searchQuery = ref('')
const selectedRegion = ref(route.query.region || '')
const categoryFilter = ref(props.category || '')
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 10

const pageTitle = computed(() => {
  if (props.category) return `${props.category} 명소 목록`
  if (selectedRegion.value) return `${selectedRegion.value} 명소 목록`
  return '전체 명소 목록'
})

async function loadPlaces() {
  loading.value = true
  // category가 없으면(전체) 4개 카테고리 모두 로드
  const targets = props.category ? [props.category] : CATEGORY_LIST

  try {
    const results = await Promise.all(
      targets.map(cat => fetch(CATEGORY_FILES[cat]).then(r => r.json()).then(data => ({ cat, data })))
    )
    const merged = []
    results.forEach(({ cat, data }) => {
      (data.items || []).forEach(item => {
        merged.push({
          ...item,
          category: cat,
          gu: extractGu(item.addr1)
        })
      })
    })
    allPlaces.value = merged
  } catch {
    allPlaces.value = []
  } finally {
    loading.value = false
  }
}

const filteredPlaces = computed(() => {
  let places = allPlaces.value

  if (selectedRegion.value) {
    places = places.filter(p => p.gu === selectedRegion.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    places = places.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.addr1 || '').toLowerCase().includes(q)
    )
  }

  // 자치구 -> 분류 -> 명소명 순으로 가나다 정렬
  places = [...places].sort((a, b) => {
    const guCompare = (a.gu || '정보없음').localeCompare(b.gu || '정보없음', 'ko')
    if (guCompare !== 0) return guCompare

    const categoryCompare = (a.category || '').localeCompare(b.category || '', 'ko')
    if (categoryCompare !== 0) return categoryCompare

    return (a.title || '').localeCompare(b.title || '', 'ko')
  })

  return places
})

const totalPages = computed(() => Math.ceil(filteredPlaces.value.length / pageSize) || 1)

const paginatedPlaces = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPlaces.value.slice(start, start + pageSize)
})

function handleCategoryChange() {
  router.push({ name: 'place-list', params: { category: categoryFilter.value || undefined } })
}

function handleTitleClick() {
  // 제목 클릭 시 모든 필터를 초기화한 전체 명소 목록으로 완전 새로고침
  window.location.href = '/places'
}

watch(() => props.category, (newCat) => {
  categoryFilter.value = newCat || ''
  loadPlaces()
})
watch(() => route.query.region, (newRegion) => {
  selectedRegion.value = newRegion || ''
})
watch([searchQuery, selectedRegion], () => { currentPage.value = 1 })

onMounted(loadPlaces)
</script>

<style scoped>
.place-list-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.place-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.place-header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
}

.place-count-badge {
  background: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #eef2f6;
  min-width: 100px;
}

.badge-value {
  font-weight: 700;
  font-size: 18px;
  color: #333;
}

.badge-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.place-controls {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.category-filter,
.region-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.place-content {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.places-container {
  padding: 20px;
}

.place-table {
  width: 100%;
  border-collapse: collapse;
}

.place-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.place-table th {
  padding: 15px 12px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.place-table td {
  padding: 12px;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.col-number { width: 8%; text-align: center; }
.col-region { width: 14%; text-align: center; }
.col-category { width: 12%; text-align: center; }
.col-title { width: 40%; }
.col-likes { width: 13%; text-align: center; }
.col-comments { width: 13%; text-align: center; }

.place-link {
  color: #666;
  text-decoration: none;
}

.place-link:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 18px;
}

@media (max-width: 768px) {
  .place-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .category-filter,
  .region-filter {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .place-list-view { padding: 10px; }
  .place-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .place-header h1 { font-size: 20px; }
  .places-container { padding: 10px; }
}
</style>