import { STORAGE_KEYS } from '@/utils/storageKeys'

/**
 * 전체 댓글 목록 로드 (모든 게시글의 댓글이 한 배열에 저장됨, postId로 구분)
 */
function loadAllComments() {
  const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveAllComments(comments) {
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
}

/**
 * 특정 게시글의 댓글만 조회 (작성일 오름차순)
 */
export function getComments(postId) {
  return loadAllComments()
    .filter(c => c.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 댓글 등록
 * @param {number} postId
 * @param {Object} data - { author, content, password }
 */
export function addComment(postId, data) {
  const comments = loadAllComments()
  const newComment = {
    id: Date.now(),
    postId,
    author: data.author?.trim() || '익명',
    content: data.content,
    password: data.password || '',
    createdAt: Date.now()
  }
  comments.push(newComment)
  saveAllComments(comments)
  return newComment
}

/**
 * 댓글 비밀번호 확인
 */
export function checkCommentPassword(commentId, password) {
  const comment = loadAllComments().find(c => c.id === commentId)
  if (!comment) return false
  return comment.password === password
}

/**
 * 댓글 삭제 (비밀번호가 맞는 경우에만 삭제되도록 호출부에서 checkCommentPassword로 먼저 검증)
 */
export function deleteComment(commentId) {
  const comments = loadAllComments()
  const filtered = comments.filter(c => c.id !== commentId)
  saveAllComments(filtered)
}

export function useComments() {
  return {
    getComments,
    addComment,
    checkCommentPassword,
    deleteComment
  }
}