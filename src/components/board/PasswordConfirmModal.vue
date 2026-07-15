<template>
  <div class="modal-overlay" @click.self="handleCancel">
    <div class="modal-box">
      <h3>비밀번호 확인</h3>
      <p class="modal-desc">
        {{ mode === 'delete' ? '삭제하려면' : '수정하려면' }} 작성 시 등록한 비밀번호를 입력하세요.
      </p>

      <input
        v-model="password"
        type="password"
        placeholder="비밀번호 입력"
        @keyup.enter="handleConfirm"
        ref="passwordInput"
      />

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <div class="modal-actions">
        <button class="confirm-btn" @click="handleConfirm">확인</button>
        <button class="cancel-btn" @click="handleCancel">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { checkPassword, deletePost } from '@/composables/usePosts'

const props = defineProps({
  postId: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  mode: {
    type: String, // 'edit' | 'delete'
    required: true
  }
})

const emit = defineEmits(['close', 'deleted'])

const router = useRouter()
const password = ref('')
const errorMessage = ref('')
const passwordInput = ref(null)

onMounted(() => {
  nextTick(() => passwordInput.value?.focus())
})

function handleConfirm() {
  if (!password.value) {
    errorMessage.value = '비밀번호를 입력해주세요.'
    return
  }

  const isValid = checkPassword(props.postId, password.value)
  if (!isValid) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    password.value = ''
    return
  }

  if (props.mode === 'delete') {
    const success = deletePost(props.postId, password.value)
    if (success) {
      emit('deleted')
      emit('close')
      router.push({ name: 'board-list', params: { category: props.category } })
    } else {
      errorMessage.value = '삭제에 실패했습니다. 다시 시도해주세요.'
    }
  } else {
    // 수정 모드: 비밀번호를 sessionStorage에 잠깐 저장 후 PostFormView로 이동
    sessionStorage.setItem(
      'edit_auth',
      JSON.stringify({ postId: props.postId, password: password.value })
    )
    emit('close')
    router.push({
      name: 'post-edit',
      params: { category: props.category, id: props.postId }
    })
  }
}

function handleCancel() {
  emit('close')
}
</script>

<style scoped>
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
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 320px;
}
.modal-box h3 {
  margin-bottom: 8px;
}
.modal-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}
.modal-box input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 8px;
}
.error {
  color: red;
  font-size: 12px;
  margin-bottom: 8px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.modal-actions button {
  padding: 6px 14px;
  cursor: pointer;
  border-radius: 4px;
  border: none;
}
.confirm-btn {
  background: #4a7dfc;
  color: #fff;
}
.cancel-btn {
  background: #eee;
}
</style>