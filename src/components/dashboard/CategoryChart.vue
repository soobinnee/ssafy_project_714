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
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { getDashboardStats } from '@/composables/usePosts'

const router = useRouter()
const canvasEl = ref(null)
let chart = null
let refreshTimer = null

const CHART_COLORS = [
  '#B8D4E8', // 파스텔 블루
  '#F0C4C4', // 파스텔 핑크
  '#C5DFC8', // 파스텔 그린
  '#F2DDB0', // 파스텔 옐로우
  '#D4C5E8', // 파스텔 라벤더
  '#F0D4C4', // 파스텔 피치
  '#C4DCE0', // 파스텔 민트
  '#E0C4D4'  // 파스텔 로즈
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
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } }
      },
      maintainAspectRatio: false,
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default'
      },
      onClick: (event, elements) => {
        if (!elements.length) return
        const index = elements[0].index
        const category = chart.data.labels[index]
        router.push({ name: 'board-list', params: { category } })
      }
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