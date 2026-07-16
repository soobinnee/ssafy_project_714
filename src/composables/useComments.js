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
 * @param {Object} data - { author, content }
 */
export function addComment(postId, data) {
  const comments = loadAllComments()
  const newComment = {
    id: Date.now(),
    postId,
    author: data.author?.trim() || '익명',
    content: data.content,
    createdAt: Date.now()
  }
  comments.push(newComment)
  saveAllComments(comments)
  return newComment
}

/**
 * 댓글 삭제 (별도 인증 없이 본인 브라우저에서만 삭제 가능하도록 간단히 처리)
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
    deleteComment
  }
}