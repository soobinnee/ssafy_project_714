<template>
  <div class="category-chart">
    <div class="chart-header">
      <h4>카테고리별 게시글 분포</h4>
      <small class="updated">최종업데이트: {{ lastUpdatedDisplay }}</small>
    </div>
    <div class="chart-wrap">
      <canvas ref="canvasEl" aria-label="카테고리 통계 차트"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Chart from 'chart.js/auto'
import { getDashboardStats } from '@/composables/usePosts'

const canvasEl = ref(null)
let chart = null
let refreshTimer = null

const CHART_COLORS = [
  '#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb7185','#60c9ff','#f59e0b'
]

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const lastUpdated = ref(null)
const lastUpdatedDisplay = computed(() => formatDate(lastUpdated.value))

function buildChart() {
  const stats = getDashboardStats()
  const byCategory = stats.byCategory || {}
  lastUpdated.value = stats.lastUpdated || null

  const labels = Object.keys(byCategory)
  const data = Object.values(byCategory)

  if (chart) {
    chart.data.labels = labels
    chart.data.datasets[0].data = data
    chart.data.datasets[0].backgroundColor = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])
    chart.update()
    return
  }

  if (!canvasEl.value) return
  chart = new Chart(canvasEl.value.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } }
      },
      maintainAspectRatio: false
    }
  })
}

onMounted(() => {
  buildChart()
  refreshTimer = setInterval(buildChart, 1500) // 캐시 갱신 반영용
})

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null }
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.category-chart {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #f3f4f6;
}
.chart-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:8px;
}
.chart-header h4 { margin:0; font-size:15px; }
.updated { font-size:12px; color:#666; }
.chart-wrap {
  width:100%;
  min-height:180px;
  position:relative;
}
.chart-wrap canvas { width:100%; height:160px; display:block; }
</style>