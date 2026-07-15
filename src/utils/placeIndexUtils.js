/**
 * 통계 계산 (places 배열 기반)
 * 반환: { total, byCategory: {cat:count}, byRegion: {region:count} }
 */
export function computeStats(places = []) {
  const stats = { total: places.length, byCategory: {}, byRegion: {} };
  for (const p of places) {
    const cat = p.category || '기타';
    const reg = p.region || p.address || '정보없음';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    stats.byRegion[reg] = (stats.byRegion[reg] || 0) + 1;
  }
  return stats;
}

/**
 * 유효성 검사: 필수 필드(contentid, title) 누락과 중복 contentid 반환
 * 반환: { missing: [{index, item, missingFields}], duplicates: { contentid: [indices...] } }
 */
export function validatePlaces(places = []) {
  const missing = [];
  const map = new Map();
  places.forEach((p, i) => {
    const missingFields = [];
    if (!p.contentid) missingFields.push('contentid');
    if (!p.title) missingFields.push('title');
    if (missingFields.length) missing.push({ index: i, item: p, missingFields });
    const id = p.contentid || `__noid__${i}`;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(i);
  });
  const duplicates = {};
  for (const [id, indices] of map.entries()) {
    if (id.startsWith('__noid__')) continue;
    if (indices.length > 1) duplicates[id] = indices;
  }
  return { missing, duplicates };
}

/**
 * contentid 기준 중복 제거(첫 등장 유지)
 * 반환: new array
 */
export function dedupeByContentId(places = []) {
  const seen = new Set();
  const out = [];
  for (const p of places) {
    const id = p.contentid || null;
    if (!id) {
      out.push(p);
      continue;
    }
    if (!seen.has(id)) {
      seen.add(id);
      out.push(p);
    }
  }
  return out;
}

/**
 * 캐시 갱신 래퍼: 외부 빌드 함수를 주입하여 호출
 * - buildFn: async function that returns places array (e.g. existing buildPlacesLite)
 * - saveFn: optional function to persist (e.g. localStorage.setItem)
 * 반환: 새로 생성된 places 배열
 */
export async function refreshPlaceCache(buildFn, saveFn) {
  if (typeof buildFn !== 'function') throw new Error('buildFn required');
  const places = await buildFn();
  const uniq = dedupeByContentId(places || []);
  if (typeof saveFn === 'function') {
    try { saveFn(uniq); } catch (e) { /* save 실패 무시 */ }
  }
  return uniq;
}