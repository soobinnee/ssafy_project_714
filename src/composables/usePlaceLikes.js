import { STORAGE_KEYS } from '@/utils/storageKeys'

/**
 * 명소별 좋아요 수 (전체 카운트)
 */
function loadLikeCounts() {
  const raw = localStorage.getItem(STORAGE_KEYS.PLACE_LIKES)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveLikeCounts(counts) {
  localStorage.setItem(STORAGE_KEYS.PLACE_LIKES, JSON.stringify(counts))
}

/**
 * 이 브라우저가 좋아요 누른 명소 id 목록 (중복 방지용)
 */
function loadLikedByMe() {
  const raw = localStorage.getItem(STORAGE_KEYS.PLACE_LIKES_USER)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveLikedByMe(list) {
  localStorage.setItem(STORAGE_KEYS.PLACE_LIKES_USER, JSON.stringify(list))
}

export function getLikeCount(contentid) {
  const counts = loadLikeCounts()
  return counts[contentid] || 0
}

export function isLikedByMe(contentid) {
  return loadLikedByMe().includes(contentid)
}

/**
 * 좋아요 토글
 * @returns {boolean} 토글 후 좋아요 상태 (true=좋아요 됨, false=취소됨)
 */
export function toggleLike(contentid) {
  const counts = loadLikeCounts()
  const likedList = loadLikedByMe()
  const alreadyLiked = likedList.includes(contentid)

  if (alreadyLiked) {
    counts[contentid] = Math.max(0, (counts[contentid] || 0) - 1)
    saveLikedByMe(likedList.filter(id => id !== contentid))
  } else {
    counts[contentid] = (counts[contentid] || 0) + 1
    saveLikedByMe([...likedList, contentid])
  }

  saveLikeCounts(counts)
  return !alreadyLiked
}

export function usePlaceLikes() {
  return {
    getLikeCount,
    isLikedByMe,
    toggleLike
  }
}