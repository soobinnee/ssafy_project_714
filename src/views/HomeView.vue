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

    <!-- 인기 명소 TOP5 (좋아요 / 댓글수) -->
    <section class="ranking-section">
      <h2>인기 명소</h2>
      <div class="ranking-grid">
        <PlaceTopRanking title="좋아요 TOP5" sortBy="likes" :limit="5" />
        <PlaceTopRanking title="댓글수 TOP5" sortBy="comments" :limit="5" />
      </div>
    </section>
  </div>
</template>

<script>
import DistrictMapChart from '../components/dashboard/DistrictMapChart.vue'
import CategoryCard from '../components/home/CategoryCard.vue'
import PlaceTopRanking from '../components/dashboard/PlaceTopRanking.vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  components: {
    DistrictMapChart,
    CategoryCard,
    PlaceTopRanking
  },
  setup() {
    const router = useRouter()

    const categories = [
      { id: 1, icon: '🏛️', label: '관광지', category: '관광지' },
      { id: 2, icon: '🎭', label: '문화시설', category: '문화시설' },
      { id: 3, icon: '🏃', label: '레포츠', category: '레포츠' },
      { id: 4, icon: '🛍️', label: '쇼핑', category: '쇼핑' }
    ]

    // 카테고리 카드 클릭 시 실제 명소 데이터 목록(place-list)으로 이동
    const handleCategorySelect = (category) => {
      router.push({ name: 'place-list', params: { category } })
    }

    return {
      categories,
      handleCategorySelect
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

/* 인기 게시글 랭킹 섹션 */
.ranking-section {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.ranking-section h2 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

.ranking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .category-section,
  .ranking-section {
    padding: 30px 15px;
  }

  .category-section h2,
  .ranking-section h2 {
    font-size: 20px;
  }

  .ranking-grid {
    grid-template-columns: 1fr;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .category-section,
  .ranking-section {
    padding: 20px 10px;
  }

  .category-section h2,
  .ranking-section h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }
}
</style>