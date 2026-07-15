<template>
  <div class="district-chart">
    <div class="chart-header">
      <h4>자치구별 게시글 분포</h4>
      <small class="updated">최종업데이트: {{ lastUpdatedDisplay }}</small>
    </div>

    <div class="chart-wrap" v-if="hasData">
      <canvas ref="canvasEl" aria-label="자치구 통계 차트"></canvas>
    </div>

    <div v-else class="empty">데이터가 없습니다.</div>
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
  '#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa',
  '#fb7185','#60c9ff','#f59e0b','#94a3b8','#7c3aed'
]

const lastUpdated = ref(null)
const labels = ref([])
const values = ref([])

const hasData = computed(() => labels.value.length > 0)
const lastUpdatedDisplay = computed(() => {
  if (!lastUpdated.value) return '-'
  const d = new Date(lastUpdated.value)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})

function buildData() {
  const stats = getDashboardStats() || {}
  const byRegion = stats.byRegion || {}
  lastUpdated.value = stats.lastUpdated || null

  const pairs = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // top 10
  labels.value = pairs.map(p => p[0])
  values.value = pairs.map(p => p[1])
}

function renderChart() {
  if (!canvasEl.value) return
  const ctx = canvasEl.value.getContext('2d')

  if (chart) {
    chart.data.labels = labels.value
    chart.data.datasets[0].data = values.value
    chart.update()
    return
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.value,
      datasets: [{
        label: '게시글 수',
        data: values.value,
        backgroundColor: labels.value.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } } },
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { ticks: { autoSkip: false } }
      }
    }
  })
}

function rebuild() {
  buildData()
  renderChart()
}

onMounted(() => {
  rebuild()
  refreshTimer = setInterval(rebuild, 1500)
})

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null }
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.district-chart {
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
  min-height:200px;
  position:relative;
}
.chart-wrap canvas { width:100%; height:180px; display:block; }
.empty {
  margin-top:10px;
  color:#888;
  text-align:center;
  font-size:13px;
}
</style>