import { STORAGE_KEYS } from '@/utils/storageKeys'
import { getPlacesLite as utilGetPlacesLite } from '@/utils/placeData'

function readCache() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLACES_LITE) || '[]') } catch { return [] }
}
function writeCache(arr) {
  try { localStorage.setItem(STORAGE_KEYS.PLACES_LITE, JSON.stringify(arr)); return true } catch { return false }
}

export async function getPlacesLite() {
  return await utilGetPlacesLite()
}

export function addPlace(data) {
  const cache = readCache()
  const newPlace = {
    contentid: String(Date.now()),
    title: data.title || '',
    address: data.address || '',
    category: data.category || '기타',
    region: data.region || '',
    mapx: data.mapx || '',
    mapy: data.mapy || '',
    firstimage: data.firstimage || '',
    createdAt: Date.now()
  }
  cache.unshift(newPlace)
  writeCache(cache)
  return newPlace
}

export function usePlaces() { return { getPlacesLite, addPlace } }