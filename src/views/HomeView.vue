<template>
  <div class="home-view">
    <!-- 타이틀 + 지역별 게시글 분포 지도 -->
    <section class="map-section">
      <div class="home-hero">
        <h1>LocalHub</h1>
        <p>서울의 숨은 보석을 발견하세요</p>
      </div>
      <DistrictMapChart />
    </section>

    <!-- 카테고리 선택 -->
    <section class="category-section">
      <h2>카테고리 선택</h2>
      <div class="category-grid">
        <CategoryCard 
          v-for="cat in categories" 
          :key="cat.id"
          :icon="cat.icon"
          :label="cat.label"
          :category="cat.category"
          @select="handleCategorySelect"
        />
      </div>
    </section>

    <!-- 최근 게시글 미리보기 -->
    <section class="recent-posts-section">
      <h2>최근 게시글</h2>
      <div v-if="recentPosts.length > 0" class="recent-posts-container">
        <PostTable 
          :posts="recentPosts"
          @select="handlePostSelect"
        />
      </div>
      <div v-else class="empty-state">
        <p>아직 등록된 게시글이 없습니다.</p>
        <router-link :to="{ name: 'post-write', query: { category: '관광지' } }" class="btn-primary">
          첫 번째 게시글 작성하기
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import DistrictMapChart from '../components/dashboard/DistrictMapChart.vue'
import CategoryCard from '../components/home/CategoryCard.vue'
import PostTable from '../components/board/PostTable.vue'
import { usePosts } from '../composables/usePosts'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  components: {
    DistrictMapChart,
    CategoryCard,
    PostTable
  },
  setup() {
    const router = useRouter()
    const { getPosts } = usePosts()

    const categories = [
      { id: 1, icon: '🏛️', label: '관광지', category: '관광지' },
      { id: 2, icon: '🎭', label: '문화시설', category: '문화시설' },
      { id: 3, icon: '🏃', label: '레포츠', category: '레포츠' },
      { id: 4, icon: '🛍️', label: '쇼핑', category: '쇼핑' }
    ]

    // 최근 게시글 6개만 조회
    const recentPosts = getPosts().slice(0, 6)

    // 카테고리 카드 클릭 시 실제 명소 데이터 목록(place-list)으로 이동
    const handleCategorySelect = (category) => {
      router.push({ name: 'place-list', params: { category } })
    }

    const handlePostSelect = (postId) => {
      router.push({ name: 'post-detail', params: { id: postId } })
    }

    return {
      categories,
      recentPosts,
      handleCategorySelect,
      handlePostSelect
    }
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 지도 섹션 */
.map-section {
  padding: 30px 20px 10px;
  max-width: 1200px;
  margin: 0 auto;
}

.home-hero {
  text-align: center;
  margin-bottom: 20px;
}

.home-hero h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a3358;
  margin: 0 0 8px;
}

.home-hero p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* 카테고리 섹션 */
.category-section {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-section h2 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 최근 게시글 섹션 */
.recent-posts-section {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.recent-posts-section h2 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

.recent-posts-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.empty-state {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 18px;
  color: #999;
  margin-bottom: 20px;
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #0056b3;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .category-section,
  .recent-posts-section {
    padding: 30px 15px;
  }

  .category-section h2,
  .recent-posts-section h2 {
    font-size: 20px;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .category-section,
  .recent-posts-section {
    padding: 20px 10px;
  }

  .category-section h2,
  .recent-posts-section h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .btn-primary {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>