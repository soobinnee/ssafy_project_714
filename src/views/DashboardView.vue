<template>
  <div class="dashboard-view">
    <header class="dv-header">
      <h2>데이터 시각화 대시보드</h2>
      <div class="dv-meta">
        <div class="meta-item">
          <div class="meta-value">{{ totalPosts }}</div>
          <div class="meta-label">전체 게시글</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">{{ lastUpdatedDisplay }}</div>
          <div class="meta-label">최종 업데이트</div>
        </div>
      </div>
    </header>

    <section class="dv-grid">
      <div class="left-col">
        <CategoryChart />
        <DistrictChart />
      </div>

      <aside class="right-col">
        <TopPostsRanking />
      </aside>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CategoryChart from '@/components/dashboard/CategoryChart.vue'
import DistrictChart from '@/components/dashboard/DistrictChart.vue'
import TopPostsRanking from '@/components/dashboard/TopPostsRanking.vue'
import { getDashboardStats } from '@/composables/usePosts'

const stats = getDashboardStats() || { byCategory: {}, byRegion: {}, lastUpdated: null }

const totalPosts = computed(() =>
  Object.values(stats.byCategory || {}).reduce((s, v) => s + v, 0)
)

const lastUpdatedDisplay = computed(() => {
  const ts = stats.lastUpdated
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.dashboard-view {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.dv-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16px;
  gap:12px;
}
.dv-header h2 { margin:0; font-size:20px; }
.dv-meta { display:flex; gap:12px; align-items:center; }
.meta-item { background:#fff; padding:8px 12px; border-radius:8px; text-align:center; border:1px solid #eef2f6; min-width:120px; }
.meta-value { font-weight:700; font-size:16px; }
.meta-label { font-size:12px; color:#666; margin-top:4px; }

.dv-grid {
  display:grid;
  grid-template-columns: 1fr 320px;
  gap:16px;
  align-items:start;
}

/* responsive */
@media (max-width: 900px) {
  .dv-grid {
    grid-template-columns: 1fr;
  }
  .right-col { order: 2; }
  .left-col { order: 1; }
}

.left-col > * { margin-bottom: 12px; }
.right-col > * { margin-bottom: 12px; }
</style>