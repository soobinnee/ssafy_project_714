import { STORAGE_KEYS } from '@/utils/storageKeys'

/**
 * 샘플/레거시 데이터의 카테고리 이름을 표준 이름으로 매핑
 * (예: '관광' -> '관광지')
 */
const CATEGORY_ALIAS = {
  '관광': '관광지'
}

/**
 * 샘플 데이터 등 placeInfo가 없는 게시글을 표준 구조로 정규화
 * (category, district 같은 flat 필드를 placeInfo.category / placeInfo.region으로 변환)
 */
function normalizePost(post) {
  if (!post.placeInfo) {
    const rawCategory = post.category || '기타'
    post.placeInfo = {
      contentid: post.contentid || null,
      title: post.location?.address || post.title || '',
      region: post.district || '정보없음',
      category: CATEGORY_ALIAS[rawCategory] || rawCategory
    }
  } else if (post.placeInfo.category) {
    // placeInfo가 이미 있어도 레거시 이름이 들어있을 수 있으니 한 번 더 매핑
    post.placeInfo.category = CATEGORY_ALIAS[post.placeInfo.category] || post.placeInfo.category
  }
  if (!post.author) {
    post.author = '익명'
  }
  return post
}

function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEYS.POSTS)
  if (!raw) return []
  try {
    const posts = JSON.parse(raw)
    return posts.map(normalizePost)
  } catch {
    return []
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
}

function loadUserLikes() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_LIKES)
  return raw ? JSON.parse(raw) : []
}

function saveUserLikes(likedIds) {
  localStorage.setItem(STORAGE_KEYS.USER_LIKES, JSON.stringify(likedIds))
}

/**
 * 게시글 조회 (placeInfo.category 기준 필터)
 */
export function getPosts(category = null) {
  const posts = loadPosts()
  if (!category) return posts
  return posts.filter(post => post.placeInfo?.category === category)
}

export function getPostById(id) {
  const posts = loadPosts()
  return posts.find(post => post.id === id) || null
}

/**
 * 검색 (제목 + 내용 기준)
 */
export function searchPosts(keyword, category = null) {
  const posts = getPosts(category)
  if (!keyword) return posts
  const lower = keyword.toLowerCase()
  return posts.filter(
    post =>
      post.title.toLowerCase().includes(lower) ||
      post.content.toLowerCase().includes(lower)
  )
}

/**
 * 게시글 등록
 * @param {Object} data - { title, content, password, placeInfo: { contentid, title, region, category } }
 */
export function addPost(data) {
  const posts = loadPosts()
  const newPost = {
    id: Date.now(), // 문서 스펙: number
    title: data.title,
    content: data.content,
    password: data.password,
    author: data.author?.trim() || '익명',
    placeInfo: data.placeInfo, // { contentid, title, region, category }
    views: 0,
    likes: 0,
    createdAt: Date.now()
  }
  posts.unshift(newPost)
  savePosts(posts)
  refreshDashboardStats()
  return newPost
}

/**
 * 게시글 수정 (비밀번호 확인 필수)
 */
export function updatePost(id, password, data) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return false
  if (posts[index].password !== password) return false

  posts[index] = {
    ...posts[index],
    title: data.title,
    content: data.content,
    author: data.author?.trim() || posts[index].author || '익명',
    placeInfo: data.placeInfo || posts[index].placeInfo
  }
  savePosts(posts)
  refreshDashboardStats()
  return true
}

/**
 * 게시글 삭제 (비밀번호 확인 필수)
 */
export function deletePost(id, password) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return false
  if (posts[index].password !== password) return false

  posts.splice(index, 1)
  savePosts(posts)
  refreshDashboardStats()
  return true
}

export function checkPassword(id, password) {
  const post = getPostById(id)
  if (!post) return false
  return post.password === password
}

/**
 * 조회수 증가
 */
export function increaseViews(id) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return
  posts[index].views += 1
  savePosts(posts)
}

/**
 * 좋아요 토글 (문서 4번: localhub_user_likes로 중복 방지)
 * @returns {boolean} 토글 후 좋아요 상태 (true=좋아요 됨, false=취소됨)
 */
export function toggleLike(id) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return false

  const likedIds = loadUserLikes()
  const alreadyLiked = likedIds.includes(id)

  if (alreadyLiked) {
    posts[index].likes = Math.max(0, posts[index].likes - 1)
    saveUserLikes(likedIds.filter(likedId => likedId !== id))
  } else {
    posts[index].likes += 1
    saveUserLikes([...likedIds, id])
  }

  savePosts(posts)
  return !alreadyLiked
}

/**
 * 이 브라우저가 해당 게시글에 좋아요를 눌렀는지 확인 (버튼 UI 상태 표시용)
 */
export function isLikedByMe(id) {
  return loadUserLikes().includes(id)
}

/**
 * 대시보드 통계 재계산 및 캐싱 (문서 5번 스펙)
 * addPost/updatePost/deletePost 시 자동 호출됨
 */
export function refreshDashboardStats() {
  const posts = loadPosts()
  const byRegion = {}
  const byCategory = {}

  posts.forEach(post => {
    const region = post.placeInfo?.region || '정보없음'
    const category = post.placeInfo?.category || '기타'
    byRegion[region] = (byRegion[region] || 0) + 1
    byCategory[category] = (byCategory[category] || 0) + 1
  })

  const stats = {
    lastUpdated: Date.now(),
    byRegion,
    byCategory
  }
  localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(stats))
  return stats
}

/**
 * 대시보드 통계 조회 (항상 최신 게시글 기준으로 재계산)
 * - 시드/직접 조작 등으로 posts가 바뀌어도 항상 정확한 값을 보장하기 위해 캐시에 의존하지 않음
 */
export function getDashboardStats() {
  return refreshDashboardStats()
}

/**
 * 조회수 기준 인기 게시글 TOP N
 */
export function getTopPosts(limit = 5) {
  const posts = loadPosts()
  return [...posts].sort((a, b) => b.views - a.views).slice(0, limit)
}

/**
 * 통합 composable - 여러 뷰에서 필요한 함수들을 묶어서 제공
 */
export function usePosts() {
  return {
    getPosts,
    getPostById,
    searchPosts,
    addPost,
    updatePost,
    deletePost,
    checkPassword,
    increaseViews,
    toggleLike,
    isLikedByMe,
    getDashboardStats,
    refreshDashboardStats,
    getTopPosts
  }
}