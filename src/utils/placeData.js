// contentTypeId 코드 → 화면에 보여줄 한글 카테고리명 매핑
export const CATEGORY_MAP = {
  '12': '관광지',
  '14': '문화시설',
  '28': '레포츠',
  '38': '쇼핑'
}

// Vite의 glob import로 data 폴더 안 JSON 파일을 한 번에 불러옴
const rawFiles = import.meta.glob('../assets/data/*.json', { eager: true })

/**
 * addr1에서 자치구(예: "종로구") 추출
 * addr1 예시: "서울특별시 종로구 사직로 161"
 */
function extractDistrict(addr1) {
  if (!addr1) return '정보없음'
  const match = addr1.match(/([가-힣]+구)/)
  return match ? match[1] : '정보없음'
}

/**
 * items[] 원본 1건을 화면에서 쓰기 좋은 형태로 가공
 */
function normalizeItem(item, region) {
  return {
    id: item.contentid,
    title: item.title,
    category: CATEGORY_MAP[item.contenttypeid] || '기타',
    address: item.addr1 || '',
    district: extractDistrict(item.addr1),
    lat: item.mapy ? parseFloat(item.mapy) : null,
    lng: item.mapx ? parseFloat(item.mapx) : null,
    image: item.firstimage || item.firstimage2 || '', // 빈 문자열이면 프론트에서 placeholder 처리
    tel: item.tel || '',
    region
  }
}

/**
 * 4개 JSON 파일을 전부 합쳐서 하나의 배열로 반환
 * @returns {Array} 정규화된 장소 데이터 전체
 */
export function getAllPlaces() {
  const allPlaces = []

  for (const path in rawFiles) {
    const fileData = rawFiles[path].default ?? rawFiles[path]
    if (!fileData?.items) continue

    const normalized = fileData.items.map(item =>
      normalizeItem(item, fileData.region)
    )
    allPlaces.push(...normalized)
  }

  return allPlaces
}

/**
 * 특정 카테고리(관광지/문화시설/레포츠/쇼핑)만 필터링
 */
export function getPlacesByCategory(category) {
  return getAllPlaces().filter(place => place.category === category)
}

/**
 * 자치구별로 그룹핑 (대시보드 통계용)
 * @returns {Object} { "종로구": 12, "강남구": 34, ... }
 */
export function getPlaceCountByDistrict() {
  const places = getAllPlaces()
  const counts = {}
  places.forEach(place => {
    counts[place.district] = (counts[place.district] || 0) + 1
  })
  return counts
}

/**
 * 카테고리별 개수 (대시보드 통계용)
 * @returns {Object} { "관광지": 783, "문화시설": 566, ... }
 */
export function getPlaceCountByCategory() {
  const places = getAllPlaces()
  const counts = {}
  places.forEach(place => {
    counts[place.category] = (counts[place.category] || 0) + 1
  })
  return counts
}