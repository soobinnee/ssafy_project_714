<template>
  <div class="place-detail-view">
    <div class="detail-container">
      <button class="btn-back" @click="handleBack">← 목록으로</button>

      <div v-if="loading" class="loading">
        <p>불러오는 중...</p>
      </div>

      <div v-else-if="place" class="place-detail-wrapper">
        <!-- 이미지 (없으면 플레이스홀더) -->
        <div v-if="place.firstimage" class="place-image">
          <img :src="place.firstimage" :alt="place.title" @error="onImageError" />
        </div>
        <div v-else class="place-image placeholder">
          <span class="placeholder-icon">🏞️</span>
          <span class="placeholder-text">이미지 없음</span>
        </div>

        <h1 class="place-title">{{ place.title }}</h1>
        <span class="category-badge">{{ category }}</span>
        <p class="place-address">{{ place.addr1 || '주소 정보 없음' }}</p>

        <button class="like-btn" :class="{ liked }" @click="handleToggleLike">
          <span>{{ liked ? '❤️' : '🤍' }}</span>
          <span>좋아요 {{ likeCount }}</span>
        </button>

        <div class="divider"></div>

        <!-- 댓글 목록 및 작성 -->
        <CommentList :postId="commentKey" />
      </div>

      <div v-else class="loading">
        <p>명소 정보를 찾을 수 없습니다.</p>
        <button @click="handleBack" class="btn-back-text">목록으로 돌아가기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CommentList from '@/components/board/CommentList.vue'
import { getLikeCount, isLikedByMe, toggleLike } from '@/composables/usePlaceLikes'
import { STORAGE_KEYS } from '@/utils/storageKeys'

const props = defineProps({
  category: { type: String, required: true },
  contentid: { type: String, required: true }
})

const router = useRouter()

const CATEGORY_FILES = {
  '관광지': '/data/서울/서울_관광지.json',
  '문화시설': '/data/서울/서울_문화시설.json',
  '레포츠': '/data/서울/서울_레포츠.json',
  '쇼핑': '/data/서울/서울_쇼핑.json'
}

const loading = ref(true)
const place = ref(null)
const likeCount = ref(0)
const liked = ref(false)

function refreshLikeState() {
  likeCount.value = getLikeCount(props.contentid)
  liked.value = isLikedByMe(props.contentid)
}

function handleToggleLike() {
  liked.value = toggleLike(props.contentid)
  likeCount.value = getLikeCount(props.contentid)
}

// 실제 명소 댓글은 사용자 게시글 댓글과 구분되도록 접두 처리한 숫자 키 사용
const commentKey = computed(() => {
  const n = Number(props.contentid)
  return Number.isFinite(n) ? 900000000000 + n : 0
})

async function loadPlace() {
  loading.value = true
  place.value = null
  const url = CATEGORY_FILES[props.category]

  try {
    if (url) {
      const res = await fetch(url)
      const data = await res.json()
      place.value = (data.items || []).find(item => String(item.contentid) === String(props.contentid)) || null
    }
  } catch {
    place.value = null
  }

  // 실제 JSON에 없으면 '장소 등록'으로 직접 추가한 명소인지 로컬 캐시에서 확인
  if (!place.value) {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLACES_LITE) || '[]')
      const custom = cached.find(p => String(p.contentid) === String(props.contentid))
      if (custom) {
        place.value = {
          contentid: custom.contentid,
          title: custom.title,
          addr1: custom.address || custom.addr1 || '',
          firstimage: custom.firstimage || ''
        }
      }
    } catch {
      // 캐시 파싱 실패 시 무시
    }
  }

  loading.value = false
}

function onImageError(e) {
  // 이미지 URL은 있지만 실제 로드에 실패하는 경우도 플레이스홀더 처리
  if (place.value) place.value.firstimage = ''
}

function handleBack() {
  router.push({ name: 'place-list', params: { category: props.category || undefined } })
}

watch(() => [props.category, props.contentid], () => {
  loadPlace()
  refreshLikeState()
})
onMounted(() => {
  loadPlace()
  refreshLikeState()
})
</script>

<style scoped>
.place-detail-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.detail-container {
  max-width: 700px;
  margin: 0 auto;
}

.btn-back {
  display: inline-block;
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: background 0.3s;
}

.btn-back:hover {
  background: #5a6268;
}

.place-detail-wrapper {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.place-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #eee;
}

.place-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.place-image.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #aaa;
}

.placeholder-icon {
  font-size: 48px;
}

.placeholder-text {
  font-size: 14px;
}

.place-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin: 0 0 10px;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e7f0fe;
  color: #2563eb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.place-address {
  font-size: 14px;
  color: #777;
  margin: 0 0 20px;
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #444;
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.like-btn:hover {
  border-color: #f87171;
}

.like-btn.liked {
  border-color: #f87171;
  background: #fef2f2;
  color: #dc2626;
  font-weight: 600;
}

.divider {
  border-bottom: 1px solid #eee;
  margin-bottom: 4px;
}

.loading {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading p {
  font-size: 16px;
  color: #999;
  margin-bottom: 20px;
}

.btn-back-text {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back-text:hover {
  background: #0056b3;
}

@media (max-width: 480px) {
  .place-detail-view { padding: 20px 12px; }
  .place-detail-wrapper { padding: 16px; }
  .place-title { font-size: 18px; }
}
</style>