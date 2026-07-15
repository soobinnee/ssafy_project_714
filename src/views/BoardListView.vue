<template>
  <div class="board-list-view">
    <!-- 헤더 -->
    <div class="board-header">
      <h1 class="board-title" @click="resetToAll">{{ pageTitle }}</h1>
      <router-link :to="{ name: 'post-write', query: { category: category || undefined } }" class="btn-write">
        ✏️ 글 작성
      </router-link>
    </div>

    <!-- 검색 및 필터 -->
    <div class="board-controls">
      <PostSearchBar @search="handleSearch" />
      <select v-model="selectedRegion" class="region-filter">
        <option value="">전체 지역</option>
        <option value="강남구">강남구</option>
        <option value="강북구">강북구</option>
        <option value="강동구">강동구</option>
        <option value="강서구">강서구</option>
        <option value="관악구">관악구</option>
        <option value="광진구">광진구</option>
        <option value="구로구">구로구</option>
        <option value="금천구">금천구</option>
        <option value="노원구">노원구</option>
        <option value="도봉구">도봉구</option>
        <option value="동대문구">동대문구</option>
        <option value="동작구">동작구</option>
        <option value="마포구">마포구</option>
        <option value="서대문구">서대문구</option>
        <option value="서초구">서초구</option>
        <option value="성동구">성동구</option>
        <option value="성북구">성북구</option>
        <option value="송파구">송파구</option>
        <option value="양천구">양천구</option>
        <option value="영등포구">영등포구</option>
        <option value="용산구">용산구</option>
        <option value="은평구">은평구</option>
        <option value="종로구">종로구</option>
        <option value="중구">중구</option>
        <option value="중랑구">중랑구</option>
      </select>
    </div>

    <!-- 게시물 목록 -->
    <div class="board-content">
      <div v-if="filteredPosts.length > 0" class="posts-container">
        <PostTable 
          :posts="filteredPosts"
          @select="handlePostSelect"
        />
        
        <!-- 페이지네이션 -->
        <PostPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @change="currentPage = $event"
        />
      </div>
      <div v-else class="empty-state">
        <p>해당하는 게시글이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostSearchBar from '../components/board/PostSearchBar.vue'
import PostTable from '../components/board/PostTable.vue'
import PostPagination from '../components/board/PostPagination.vue'
import { usePosts } from '../composables/usePosts'

export default {
  name: 'BoardListView',
  components: {
    PostSearchBar,
    PostTable,
    PostPagination
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { getPosts } = usePosts()

    // category가 없으면 전체 게시판(빈 문자열로 취급) - 라우트가 바뀔 때마다 실시간 반영
    const category = computed(() => route.params.category || '')
    const searchQuery = ref('')
    // 지도에서 지역 클릭으로 넘어온 경우 쿼리의 region 값을 초기 필터로 사용
    const selectedRegion = ref(route.query.region || '')
    const currentPage = ref(1)
    const postsPerPage = 10

    // 필터링된 게시글
    const filteredPosts = computed(() => {
      let posts = getPosts()

      // 1. 카테고리 필터 (category가 없으면 전체 게시글 대상)
      if (category.value) {
        posts = posts.filter(p => 
          p.placeInfo && p.placeInfo.category === category.value
        )
      }

      // 2. 지역 필터
      if (selectedRegion.value) {
        posts = posts.filter(p => 
          p.placeInfo && p.placeInfo.region === selectedRegion.value
        )
      }

      // 3. 검색어 필터
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        posts = posts.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          (p.placeInfo && p.placeInfo.title.toLowerCase().includes(query))
        )
      }

      return posts
    })

    // 페이지네이션
    const totalPages = computed(() => 
      Math.ceil(filteredPosts.value.length / postsPerPage)
    )

    const paginatedPosts = computed(() => {
      const start = (currentPage.value - 1) * postsPerPage
      const end = start + postsPerPage
      return filteredPosts.value.slice(start, end)
    })

    const handleSearch = (query) => {
      searchQuery.value = query
      currentPage.value = 1
    }

    // ✅ 개선: selectedRegion 변경 시 currentPage 초기화
    watch(() => selectedRegion.value, () => {
      currentPage.value = 1
    })

    // ✅ 개선: 라우트(카테고리)가 바뀔 때도 페이지 초기화
    watch(() => category.value, () => {
      currentPage.value = 1
    })

    // clear search when route path/name changes so header/menu -> 전체 works
    watch(() => route.fullPath, () => {
      if (router.currentRoute.value?.name === 'board-list') {
        searchQuery.value = ''
        currentPage.value = 1
        // ✅ 지역 필터도 URL의 region 쿼리 값과 동기화 (메뉴 클릭 시 초기화되도록)
        selectedRegion.value = route.query.region || ''
      }
    })

    // 카테고리가 있으면 카테고리명, 없고 지역만 있으면 지역명, 둘 다 없으면 전체
    const pageTitle = computed(() => {
      if (category.value) return `${category.value} 게시판`
      if (selectedRegion.value) return `${selectedRegion.value} 게시판`
      return '전체 게시판'
    })

    const handlePostSelect = (postId) => {
      router.push({ name: 'post-detail', params: { id: postId } })
    }

    // 제목 클릭 시 검색어/지역 필터 초기화하고 전체 게시판으로 이동
    const resetToAll = () => {
      searchQuery.value = ''
      selectedRegion.value = ''
      currentPage.value = 1
      router.push({ name: 'board-list' })
    }

    return {
      category,
      pageTitle,
      selectedRegion,
      currentPage,
      totalPages,
      filteredPosts: paginatedPosts,
      handleSearch,
      handlePostSelect,
      resetToAll
    }
  }
}
</script>

<style scoped>
.board-list-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.board-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
}

.btn-write {
  display: inline-block;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-write:hover {
  background: #218838;
}

.board-controls {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.region-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.board-content {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.posts-container {
  padding: 20px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 18px;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .board-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .board-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .region-filter {
    width: 100%;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .board-list-view {
    padding: 10px;
  }

  .board-header {
    margin-bottom: 20px;
  }

  .board-header h1 {
    font-size: 20px;
  }

  .btn-write {
    font-size: 14px;
    padding: 8px 16px;
  }

  .posts-container {
    padding: 10px;
  }
}
</style>