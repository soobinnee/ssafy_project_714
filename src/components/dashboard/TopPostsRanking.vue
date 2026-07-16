<template>
  <div class="top-posts">
    <div class="header">
      <h4>{{ title }}</h4>
      <button class="refresh" @click="rebuild">새로고침</button>
    </div>

    <ul v-if="posts.length" class="list">
      <li v-for="(p, idx) in posts" :key="p.id" @click="goDetail(p)" class="item">
        <div class="rank">{{ idx + 1 }}</div>
        <div class="meta">
          <div class="title">{{ p.title || '(제목 없음)' }}</div>
          <div class="sub">
            <span class="category">{{ p.placeInfo?.category || '기타' }}</span>
            <span class="region">{{ p.placeInfo?.region || '' }}</span>
          </div>
        </div>
        <div class="stats">
          <span class="views">👁️ {{ p.views }}</span>
          <span class="likes">❤️ {{ p.likes }}</span>
        </div>
      </li>
    </ul>

    <div v-else class="empty">게시글이 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getTopPosts, getTopPostsByLikes } from '@/composables/usePosts'

const props = defineProps({
  title: {
    type: String,
    default: '인기 게시글'
  },
  limit: {
    type: Number,
    default: 5
  },
  sortBy: {
    type: String,
    default: 'views', // 'views' | 'likes'
    validator: (v) => ['views', 'likes'].includes(v)
  }
})

const router = useRouter()
const posts = ref([])
let refreshTimer = null

function rebuild() {
  posts.value = (props.sortBy === 'likes' ? getTopPostsByLikes(props.limit) : getTopPosts(props.limit)) || []
}

function goDetail(post) {
  router.push({
    name: 'post-detail',
    params: { category: post.placeInfo?.category || '전체', id: post.id }
  }).catch(()=>{})
}

onMounted(() => {
  rebuild()
  refreshTimer = setInterval(rebuild, 1500)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.top-posts {
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
  cursor:pointer;
}
.item + .item { margin-top:6px; border-top:1px dashed #f0f2f5; padding-top:10px; }
.rank { width:28px; text-align:center; font-weight:700; color:#334155; }
.meta { flex:1; min-width:0; }
.title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sub { font-size:12px; color:#64748b; margin-top:4px; }
.stats { font-size:13px; color:#475569; display:flex; gap:8px; align-items:center; }
.empty { color:#888; text-align:center; padding:16px 0; }
</style>