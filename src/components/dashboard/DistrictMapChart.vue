<template>
  <div class="district-map-chart">
    <div ref="mapEl" class="map-container"></div>
    <p class="map-attribution">© OpenStreetMap contributors</p>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
const router = useRouter()
const mapEl = ref(null)
let map = null
function colorFor(count) {
  return count ? '#4f46e5' : '#f5f6f8'
}
function opacityFor(count, max) {
  if (!count) return 0.6
  const ratio = max > 0 ? count / max : 0
  return 0.3 + ratio * 0.7
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
async function loadRealPlaceCounts() {
  const files = [
    '/data/서울/서울_관광지.json',
    '/data/서울/서울_레포츠.json',
    '/data/서울/서울_문화시설.json',
    '/data/서울/서울_쇼핑.json'
  ]
  const results = await Promise.all(files.map(f => fetch(f).then(r => r.json())))
  const byRegion = {}
  results.forEach(data => {
    (data.items || []).forEach(item => {
      const gu = extractGu(item.addr1)
      if (gu) byRegion[gu] = (byRegion[gu] || 0) + 1
    })
  })
  return byRegion
}
async function drawMap() {
  const [geoRes, byRegion] = await Promise.all([
    fetch('/data/seoul_districts.geojson').then(r => r.json()),
    loadRealPlaceCounts()
  ])
  const geojson = geoRes
  const maxCount = Math.max(0, ...Object.values(byRegion))
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    opacity: 0.3
  }).addTo(map)
  const geoLayer = L.geoJSON(geojson, {
    style: feature => {
      const name = feature.properties.name || feature.properties.SIG_KOR_NM
      const count = byRegion[name] || 0
      return {
        fillColor: colorFor(count),
        fillOpacity: opacityFor(count, maxCount),
        color: '#ffffff',
        weight: 1
      }
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || feature.properties.SIG_KOR_NM
      const count = byRegion[name] || 0
      layer.bindTooltip(`${name}: 명소 ${count}개`, { sticky: true })
      layer.on('mouseover', () => {
        layer.getElement()?.style.setProperty('cursor', 'pointer')
      })
      layer.on('click', () => {
        // 사용자 게시글 게시판이 아니라 실제 명소 목록(전체 카테고리)에서 해당 구로 필터링
        router.push({ name: 'place-list', query: { region: name } })
      })
    }
  }).addTo(map)
  map.fitBounds(geoLayer.getBounds(), { padding: [0, 0] })
  map.setZoom(map.getZoom())
  // 컨테이너 크기가 바뀌어도 지도가 다시 중앙/사이즈를 맞추도록
  setTimeout(() => {
    map.invalidateSize()
    map.fitBounds(geoLayer.getBounds(), { padding: [0, 0] })
  }, 100)
}
onMounted(drawMap)
onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
<style scoped>
.district-map-chart {
  width: 100%;
}
.map-container {
  width: 100%;
  height: 550px;
  border-radius: 8px;
  overflow: hidden;
}
.map-container :deep(.leaflet-interactive:focus) {
  outline: none;
}
.map-attribution {
  margin: 4px 0 0;
  font-size: 11px;
  color: #999;
  text-align: right;
}
</style>