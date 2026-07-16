<template>
  <div class="district-chart">
    <div class="chart-wrap" v-if="hasData" :style="{ height: chartHeight + 'px' }">
      <canvas ref="canvasEl" aria-label="자치구별 명소 카테고리 분포 차트"></canvas>
    </div>

    <div v-else class="empty">데이터가 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import Chart from 'chart.js/auto'

const canvasEl = ref(null)
let chart = null

const CATEGORY_FILES = {
  '관광지': '/data/서울/서울_관광지.json',
  '레포츠': '/data/서울/서울_레포츠.json',
  '문화시설': '/data/서울/서울_문화시설.json',
  '쇼핑': '/data/서울/서울_쇼핑.json'
}
const CATEGORY_LIST = Object.keys(CATEGORY_FILES)
const CATEGORY_COLORS = {
  '관광지': '#B8D4E8', // 파스텔 블루
  '쇼핑': '#F0C4C4',   // 파스텔 핑크
  '문화시설': '#C5DFC8', // 파스텔 그린
  '레포츠': '#F2DDB0'   // 파스텔 옐로우
}

const GU_LIST = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]

function extractGu(addr1) {
  if (!addr1) return null
  return GU_LIST.find(gu => addr1.includes(gu)) || null
}

async function loadCountsByDistrictAndCategory() {
  const entries = Object.entries(CATEGORY_FILES)
  const results = await Promise.all(
    entries.map(([, url]) => fetch(url).then(r => r.json()))
  )
  const byDistrict = {}
  results.forEach((data, i) => {
    const category = entries[i][0]
    ;(data.items || []).forEach(item => {
      const gu = extractGu(item.addr1)
      if (!gu) return
      if (!byDistrict[gu]) byDistrict[gu] = {}
      byDistrict[gu][category] = (byDistrict[gu][category] || 0) + 1
    })
  })
  return byDistrict
}

// stacked 구간 안에 실제 개수를 표시하는 커스텀 플러그인 (외부 datalabels 패키지 불필요)
const valueLabelPlugin = {
  id: 'valueLabelPlugin',
  afterDatasetsDraw(c) {
    const { ctx } = c
    c.data.datasets.forEach((dataset, dsIndex) => {
      const meta = c.getDatasetMeta(dsIndex)
      meta.data.forEach((bar, i) => {
        const value = dataset.data[i]
        if (!value) return
        const { x, y, base } = bar.getProps(['x', 'y', 'base'], true)
        const width = Math.abs(x - base)
        if (width < 18) return // 너무 좁으면 라벨 생략
        ctx.save()
        ctx.fillStyle = '#334155'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(value), (x + base) / 2, y)
        ctx.restore()
      })
    })
  }
}

const labels = ref([])           // 자치구명 목록
const countsByDistrict = ref({}) // { gu: { category: count } }

const hasData = computed(() => labels.value.length > 0)
const chartHeight = computed(() => Math.max(200, labels.value.length * 40 + 40))

async function buildData() {
  const byDistrict = await loadCountsByDistrictAndCategory()

  // 전체 명소 수 기준 내림차순 정렬
  const sorted = Object.entries(byDistrict)
    .map(([gu, cats]) => [gu, cats, Object.values(cats).reduce((s, v) => s + v, 0)])
    .sort((a, b) => b[2] - a[2])

  labels.value = sorted.map(([gu]) => gu)
  countsByDistrict.value = Object.fromEntries(sorted.map(([gu, cats]) => [gu, cats]))
}

function toDatasets() {
  return CATEGORY_LIST.map(category => ({
    label: category,
    data: labels.value.map(gu => countsByDistrict.value[gu]?.[category] || 0),
    backgroundColor: CATEGORY_COLORS[category],
    borderRadius: 4,
    stack: 'district'
  }))
}

function renderChart() {
  if (!canvasEl.value) return
  const datasets = toDatasets()

  if (chart) {
    chart.data.labels = labels.value
    chart.data.datasets = datasets
    chart.resize()
    chart.update()
    return
  }

  chart = new Chart(canvasEl.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels.value,
      datasets
    },
    plugins: [valueLabelPlugin],
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x}개`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          ticks: { precision: 0 }
        },
        y: {
          stacked: true,
          ticks: { autoSkip: false }
        }
      }
    }
  })
}

async function rebuild() {
  await buildData()
  await nextTick()
  renderChart()
}

onMounted(rebuild)

onBeforeUnmount(() => {
  if (chart) { chart.destroy(); chart = null }
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
  position:relative;
}
.chart-wrap canvas { width:100%; height:100%; display:block; }
.empty {
  margin-top:10px;
  color:#888;
  text-align:center;
  font-size:13px;
}
</style>