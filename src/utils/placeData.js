import { STORAGE_KEYS } from './storageKeys'

const CATEGORY_MAP = {
  '12': '관광지',
  '14': '문화시설',
  '28': '레포츠',
  '38': '쇼핑'
}

const rawFiles = import.meta.glob('../assets/data/*.json', { eager: true })

/**
 * items[] 원본 1건을 PlaceLite 스키마로 변환
 * (mapx/mapy는 문서 스펙대로 string 그대로 유지)
 */
function toPlaceLite(item) {
  return {
    contentid: item.contentid,
    title: item.title,
    address: item.addr1 || '',
    category: CATEGORY_MAP[item.contenttypeid] || '기타',
    mapx: item.mapx || '',
    mapy: item.mapy || ''
  }
}

/**
 * 4개 JSON 파일을 합쳐 PlaceLite 배열 생성 + localStorage 캐싱
 * (문서 3번 원칙: 매번 파싱하지 않도록 localhub_places_lite에 저장)
 */
export function buildPlacesLite() {
  const allPlaces = []
  for (const path in rawFiles) {
    const fileData = rawFiles[path].default ?? rawFiles[path]
    if (!fileData?.items) continue
    allPlaces.push(...fileData.items.map(toPlaceLite))
  }
  localStorage.setItem(STORAGE_KEYS.PLACES_LITE, JSON.stringify(allPlaces))
  return allPlaces
}

/**
 * PlaceLite 목록 조회 (캐시 있으면 캐시 사용, 없으면 새로 생성)
 */
export function getPlacesLite() {
  const cached = localStorage.getItem(STORAGE_KEYS.PLACES_LITE)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // 캐시 손상 시 재생성
    }
  }
  return buildPlacesLite()
}

/**
 * 카테고리 필터
 */
export function getPlacesByCategory(category) {
  return getPlacesLite().filter(place => place.category === category)
}

/**
 * 장소 검색 (게시글 작성 시 placeInfo 선택용) — title, address 기준
 */
export function searchPlaces(keyword, category = null) {
  const places = category ? getPlacesByCategory(category) : getPlacesLite()
  if (!keyword) return places
  const lower = keyword.toLowerCase()
  return places.filter(
    place =>
      place.title.toLowerCase().includes(lower) ||
      place.address.toLowerCase().includes(lower)
  )
}

/**
 * addr1에서 자치구(예: "종로구") 추출 — placeInfo.region 채울 때 사용
 */
export function extractDistrict(address) {
  if (!address) return '정보없음'
  const match = address.match(/([가-힣]+구)/)
  return match ? match[1] : '정보없음'
}