<template>
  <div class="comment-section">
    <h3 class="comment-title">댓글 {{ comments.length }}개</h3>

    <!-- 댓글 작성 폼 -->
    <form class="comment-form" @submit.prevent="handleSubmit">
      <div class="form-row">
        <input
          v-model="authorInput"
          type="text"
          class="comment-author-input"
          placeholder="닉네임 (선택)"
          maxlength="20"
        />
        <input
          v-model="passwordInput"
          type="password"
          class="comment-password-input"
          placeholder="비밀번호 (삭제/수정 시 필요)"
          maxlength="20"
          required
        />
      </div>
      <textarea
        v-model="contentInput"
        class="comment-content-input"
        placeholder="댓글을 남겨보세요"
        rows="3"
        required
      ></textarea>
      <button type="submit" class="btn-submit">등록</button>
    </form>

    <!-- 댓글 목록 -->
    <ul v-if="comments.length > 0" class="comment-list">
      <li v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">{{ comment.author }}</span>
          <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
        </div>

        <!-- 수정 모드 -->
        <template v-if="editingCommentId === comment.id">
          <textarea
            v-model="editContent"
            class="comment-edit-input"
            rows="3"
          ></textarea>
          <div class="edit-actions">
            <button class="btn-save" @click="handleSaveEdit(comment.id)">저장</button>
            <button class="btn-cancel" @click="cancelEdit">취소</button>
          </div>
        </template>

        <!-- 일반 표시 -->
        <template v-else>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-actions">
            <button class="btn-edit" @click="requestEdit(comment.id)">수정</button>
            <button class="btn-delete" @click="requestDelete(comment.id)">삭제</button>
          </div>
        </template>
      </li>
    </ul>
    <div v-else class="comment-empty">
      <p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
    </div>

    <!-- 비밀번호 확인 모달 -->
    <div v-if="passwordModal.visible" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal-box">
        <h4>{{ passwordModal.mode === 'delete' ? '댓글 삭제' : '댓글 수정' }}</h4>
        <p>비밀번호를 입력하세요.</p>
        <input
          v-model="passwordModal.input"
          type="password"
          class="modal-password-input"
          maxlength="20"
          autofocus
          @keyup.enter="confirmPasswordModal"
        />
        <p v-if="passwordModal.error" class="modal-error">비밀번호가 일치하지 않습니다.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closePasswordModal">취소</button>
          <button class="btn-confirm" @click="confirmPasswordModal">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useComments } from '@/composables/useComments'

const props = defineProps({
  postId: {
    type: Number,
    required: true
  }
})

const { getComments, addComment, checkCommentPassword, updateComment, deleteComment } = useComments()

const comments = ref([])
const authorInput = ref('')
const passwordInput = ref('')
const contentInput = ref('')

const editingCommentId = ref(null)
const editContent = ref('')

const passwordModal = ref({
  visible: false,
  mode: null, // 'delete' | 'edit'
  commentId: null,
  input: '',
  error: false
})

function refresh() {
  comments.value = getComments(props.postId)
}

function handleSubmit() {
  if (!contentInput.value.trim()) return
  if (!passwordInput.value.trim()) {
    alert('수정/삭제 시 필요한 비밀번호를 입력해주세요.')
    return
  }
  addComment(props.postId, {
    author: authorInput.value,
    content: contentInput.value.trim(),
    password: passwordInput.value
  })
  contentInput.value = ''
  passwordInput.value = ''
  refresh()
}

function requestDelete(commentId) {
  passwordModal.value = { visible: true, mode: 'delete', commentId, input: '', error: false }
}

function requestEdit(commentId) {
  passwordModal.value = { visible: true, mode: 'edit', commentId, input: '', error: false }
}

function closePasswordModal() {
  passwordModal.value = { visible: false, mode: null, commentId: null, input: '', error: false }
}

function confirmPasswordModal() {
  const { mode, commentId, input } = passwordModal.value

  if (!checkCommentPassword(commentId, input)) {
    passwordModal.value.error = true
    return
  }

  if (mode === 'delete') {
    deleteComment(commentId)
    refresh()
  } else if (mode === 'edit') {
    const target = comments.value.find(c => c.id === commentId)
    editingCommentId.value = commentId
    editContent.value = target?.content || ''
  }

  closePasswordModal()
}

function handleSaveEdit(commentId) {
  if (!editContent.value.trim()) return
  updateComment(commentId, editContent.value.trim())
  editingCommentId.value = null
  editContent.value = ''
  refresh()
}

function cancelEdit() {
  editingCommentId.value = null
  editContent.value = ''
}

function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(refresh)
</script>

<style scoped>
.comment-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.comment-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.comment-author-input,
.comment-password-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  max-width: 200px;
}

.comment-content-input,
.comment-edit-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.btn-submit {
  align-self: flex-end;
  padding: 8px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-submit:hover {
  background: #0056b3;
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.comment-item {
  position: relative;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-meta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 6px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.comment-content {
  margin: 0;
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  white-space: pre-wrap;
  padding-right: 90px;
}

.comment-actions {
  position: absolute;
  top: 14px;
  right: 0;
  display: flex;
  gap: 10px;
}

.btn-edit,
.btn-delete {
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.btn-edit {
  color: #2563eb;
}

.btn-edit:hover,
.btn-delete:hover {
  text-decoration: underline;
}

.btn-delete {
  color: #dc3545;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-save {
  padding: 6px 14px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-save:hover {
  background: #0056b3;
}

.btn-cancel {
  padding: 6px 14px;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel:hover {
  background: #d1d5db;
}

.comment-empty {
  text-align: center;
  padding: 30px 0;
  color: #999;
  font-size: 14px;
}

.comment-empty p {
  margin: 0;
}

/* 비밀번호 확인 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-box h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #222;
}

.modal-box p {
  margin: 0 0 12px;
  font-size: 13px;
  color: #666;
}

.modal-password-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.modal-error {
  color: #dc3545 !important;
  font-size: 12px !important;
  margin-top: 6px !important;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.btn-confirm {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-confirm:hover {
  background: #0056b3;
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
  .comment-author-input,
  .comment-password-input {
    max-width: none;
  }
}
</style>