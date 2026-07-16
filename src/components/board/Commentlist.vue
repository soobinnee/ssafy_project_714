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
          placeholder="비밀번호 (삭제 시 필요)"
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
        <p class="comment-content">{{ comment.content }}</p>
        <button class="btn-delete" @click="handleDelete(comment.id)">삭제</button>
      </li>
    </ul>
    <div v-else class="comment-empty">
      <p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
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

const { getComments, addComment, checkCommentPassword, deleteComment } = useComments()

const comments = ref([])
const authorInput = ref('')
const passwordInput = ref('')
const contentInput = ref('')

function refresh() {
  comments.value = getComments(props.postId)
}

function handleSubmit() {
  if (!contentInput.value.trim()) return
  if (!passwordInput.value.trim()) {
    alert('삭제 시 필요한 비밀번호를 입력해주세요.')
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

function handleDelete(commentId) {
  const input = prompt('댓글 삭제를 위해 비밀번호를 입력하세요.')
  if (input === null) return // 취소

  if (!checkCommentPassword(commentId, input)) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  deleteComment(commentId)
  refresh()
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

.comment-author-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  max-width: 200px;
}

.comment-password-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  max-width: 200px;
}

.comment-content-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
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
  padding-right: 50px;
}

.btn-delete {
  position: absolute;
  top: 14px;
  right: 0;
  background: transparent;
  border: none;
  color: #dc3545;
  font-size: 12px;
  cursor: pointer;
}

.btn-delete:hover {
  text-decoration: underline;
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