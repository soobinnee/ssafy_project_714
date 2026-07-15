const STORAGE_KEY = 'localhub_posts'

/**
 * localStorage에서 전체 게시글 배열 가져오기
 */
function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

/**
 * 전체 게시글 배열을 localStorage에 저장
 */
function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

/**
 * 전체 게시글 조회 (선택적으로 카테고리 필터)
 */
export function getPosts(category = null) {
  const posts = loadPosts()
  if (!category) return posts
  return posts.filter(post => post.category === category)
}

/**
 * id로 게시글 1건 조회
 */
export function getPostById(id) {
  const posts = loadPosts()
  return posts.find(post => post.id === id) || null
}

/**
 * 게시글 검색 (제목 + 내용 기준)
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
 * @param {Object} data - { title, content, password, category, district }
 */
export function addPost(data) {
  const posts = loadPosts()
  const newPost = {
    id: Date.now().toString(),
    title: data.title,
    content: data.content,
    password: data.password,
    category: data.category,
    district: data.district || '',
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  }
  posts.unshift(newPost) // 최신 글이 앞에 오도록
  savePosts(posts)
  return newPost
}

/**
 * 게시글 수정 (비밀번호 확인 필요)
 * @returns {boolean} 성공 여부
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
    category: data.category,
    district: data.district || posts[index].district
  }
  savePosts(posts)
  return true
}

/**
 * 게시글 삭제 (비밀번호 확인 필요)
 * @returns {boolean} 성공 여부
 */
export function deletePost(id, password) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return false
  if (posts[index].password !== password) return false

  posts.splice(index, 1)
  savePosts(posts)
  return true
}

/**
 * 비밀번호 일치 여부만 확인 (수정/삭제 버튼 클릭 시 모달에서 사용)
 */
export function checkPassword(id, password) {
  const post = getPostById(id)
  if (!post) return false
  return post.password === password
}

/**
 * 조회수 증가 (상세 페이지 진입 시 호출)
 */
export function increaseViews(id) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return
  posts[index].views += 1
  savePosts(posts)
}

/**
 * 좋아요 토글
 * (별도 "누가 눌렀는지" 추적 없이 단순 증가 방식 — 인증 체계가 없는 프로젝트 특성상 최소 구현)
 */
export function toggleLike(id) {
  const posts = loadPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return
  posts[index].likes += 1
  savePosts(posts)
}

/**
 * 카테고리별 게시글 수 (대시보드용)
 */
export function getPostCountByCategory() {
  const posts = loadPosts()
  const counts = {}
  posts.forEach(post => {
    counts[post.category] = (counts[post.category] || 0) + 1
  })
  return counts
}

/**
 * 자치구별 게시글 수 (대시보드용)
 */
export function getPostCountByDistrict() {
  const posts = loadPosts()
  const counts = {}
  posts.forEach(post => {
    counts[post.district] = (counts[post.district] || 0) + 1
  })
  return counts
}

/**
 * 조회수 기준 인기 게시글 TOP N (대시보드 랭킹용)
 */
export function getTopPosts(limit = 5) {
  const posts = loadPosts()
  return [...posts].sort((a, b) => b.views - a.views).slice(0, limit)
}