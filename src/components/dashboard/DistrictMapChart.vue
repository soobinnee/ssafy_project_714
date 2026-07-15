<template>
  <div class="district-map-chart">
    <div ref="mapEl" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getDashboardStats } from '@/composables/usePosts'

const mapEl = ref(null)
let map = null

function colorFor(count) {
  return count ? 'rgb(87,108,228)' : '#f5f6f8'
}

function opacityFor(count, max) {
  if (!count) return 0.55
  const ratio = max > 0 ? count / max : 0
  return 0.65 + ratio * 0.35
}

async function drawMap() {
  const res = await fetch('/data/seoul_districts.geojson')
  const geojson = await res.json()

  const stats = getDashboardStats()
  const byRegion = stats.byRegion || {}
  const maxCount = Math.max(0, ...Object.values(byRegion))

  map = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map)

  const geoLayer = L.geoJSON(geojson, {
    style: feature => {
      const name = feature.properties.name || feature.properties.SIG_KOR_NM
      const count = byRegion[name] || 0
      return {
        fillColor: colorFor(count),
        fillOpacity: opacityFor(count, maxCount),
        color: '#334155',
        weight: 1
      }
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.name || feature.properties.SIG_KOR_NM
      const count = byRegion[name] || 0
      layer.bindTooltip(`${name}: ${count}건`, { sticky: true })
    }
  }).addTo(map)

  map.fitBounds(geoLayer.getBounds(), { padding: [0, 0] })
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
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
}
</style>