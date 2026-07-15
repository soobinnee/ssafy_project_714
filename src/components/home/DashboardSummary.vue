<template>
  <div class="dashboard-summary">
    <header class="ds-header">
      <h3>대시보드 요약</h3>
      <button class="link-btn" @click="goDashboard">자세히 보기</button>
    </header>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalPosts }}</div>
        <div class="stat-label">전체 게시글</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ lastUpdatedDisplay }}</div>
        <div class="stat-label">최종 업데이트</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-block">
        <canvas ref="categoryCanvas" aria-label="카테고리 통계"></canvas>
        <div class="chart-title">카테고리별 분포</div>
      </div>

      <div class="chart-block">
        <canvas ref="regionCanvas" aria-label="자치구 통계"></canvas>
        <div class="chart-title">상위 자치구(Top 5)</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { getDashboardStats } from '@/composables/usePosts'

const router = useRouter()
const categoryCanvas = ref(null)
const regionCanvas = ref(null)

let categoryChart = null
let regionChart = null
let refreshTimer = null

function formatTimestamp(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function buildCharts() {
  const stats = getDashboardStats()
  const byCategory = stats.byCategory || {}
  const byRegion = stats.byRegion || {}
  const lastUpdated = stats.lastUpdated || null

  totalPosts.value = Object.values(byCategory).reduce((s, v) => s + v, 0)
  lastUpdatedValue.value = lastUpdated

  const catLabels = Object.keys(byCategory)
  const catData = Object.values(byCategory)

  if (categoryChart) categoryChart.destroy()
  if (categoryCanvas.value) {
    categoryChart = new Chart(categoryCanvas.value.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: catLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } },
        maintainAspectRatio: false
      }
    })
  }

  const regionPairs = Object.entries(byRegion).sort((a,b) => b[1] - a[1]).slice(0,5)
  const regLabels = regionPairs.map(p => p[0])
  const regData = regionPairs.map(p => p[1])

  if (regionChart) regionChart.destroy()
  if (regionCanvas.value) {
    regionChart = new Chart(regionCanvas.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: regLabels,
        datasets: [{
          label: '게시글 수',
          data: regData,
          backgroundColor: regLabels.map((_, i) => CHART_COLORS[(i+3) % CHART_COLORS.length])
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    })
  }
}

const totalPosts = ref(0)
const lastUpdatedValue = ref(null)
const lastUpdatedDisplay = computed(() => formatTimestamp(lastUpdatedValue.value))

const CHART_COLORS = [
  '#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb7185','#60c9ff','#f59e0b'
]

onMounted(() => {
  buildCharts()
  refreshTimer = setInterval(buildCharts, 1500)
})

onBeforeUnmount(() => {
  if (categoryChart) categoryChart.destroy()
  if (regionChart) regionChart.destroy()
  if (refreshTimer) clearInterval(refreshTimer)
})

function goDashboard() {
  router.push({ path: '/dashboard' })
}
</script>

<style scoped>
.dashboard-summary {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ds-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:8px;
}
.ds-header h3 { margin:0; font-size:16px; }
.link-btn {
  background: transparent;
  border: none;
  color: #2b6cb0;
  cursor: pointer;
  font-size:13px;
}
.stats-row {
  display:flex;
  gap:12px;
  margin-bottom:12px;
}
.stat-card {
  flex:1;
  padding:10px;
  background:#fafafa;
  border-radius:6px;
  text-align:center;
}
.stat-value { font-weight:700; font-size:18px; }
.stat-label { font-size:12px; color:#666; margin-top:4px; }

.charts {
  display:flex;
  gap:12px;
  align-items:stretch;
}
.chart-block {
  flex:1;
  min-height:140px;
  position:relative;
  background:#fff;
  padding:8px;
  border-radius:6px;
  border:1px solid #f0f0f0;
}
.chart-block canvas { width:100%; height:110px; display:block; }
.chart-title { text-align:center; font-size:12px; color:#444; margin-top:6px; }
</style>