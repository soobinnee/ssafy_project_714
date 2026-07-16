<template>
  <div class="dashboard-view">
    <header class="dv-header">
      <h2>자치구별 명소 분포</h2>
      <div class="dv-meta">
        <div class="meta-item">
          <div class="meta-value">{{ totalPlaces }}</div>
          <div class="meta-label">전체 명소</div>
        </div>
      </div>
    </header>

    <section class="dv-grid">
      <DistrictChart />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DistrictChart from '@/components/dashboard/DistrictChart.vue'

const CATEGORY_FILES = [
  '/data/서울/서울_관광지.json',
  '/data/서울/서울_레포츠.json',
  '/data/서울/서울_문화시설.json',
  '/data/서울/서울_쇼핑.json'
]

const totalPlaces = ref(0)

async function loadTotalPlaces() {
  try {
    const results = await Promise.all(
      CATEGORY_FILES.map(url => fetch(url).then(r => r.json()))
    )
    totalPlaces.value = results.reduce((sum, data) => sum + (data.items?.length || 0), 0)
  } catch {
    totalPlaces.value = 0
  }
}

onMounted(loadTotalPlaces)
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
  grid-template-columns: 1fr;
  gap:16px;
  align-items:start;
}

.dv-grid > * { margin-bottom: 12px; }
</style>