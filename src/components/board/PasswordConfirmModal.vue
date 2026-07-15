<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="handleBackgroundClick">
      <div class="modal-box" @click.stop>
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button type="button" @click="handleCancel" class="close-btn">✕</button>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>
        </div>

        <!-- 모달 폼 -->
        <form @submit.prevent="handleConfirm" class="modal-form">
          <div class="form-group">
            <label for="password">비밀번호</label>
            <input
              id="password"
              ref="passwordInput"
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              @keyup.enter="handleConfirm"
              @keyup.esc="handleCancel"
            />
            <span v-if="error" class="error-message">{{ error }}</span>
          </div>

          <!-- 모달 액션 버튼 -->
          <div class="modal-actions">
            <button type="submit" class="btn-confirm">확인</button>
            <button type="button" @click="handleCancel" class="btn-cancel">취소</button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'PasswordConfirmModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: '비밀번호 확인'
    },
    message: {
      type: String,
      default: '작업을 진행하기 위해 비밀번호를 입력하세요.'
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      password: '',
      error: ''
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.password = ''
        this.error = ''
        // 모달이 열릴 때 자동으로 input에 포커스
        this.$nextTick(() => {
          this.$refs.passwordInput?.focus()
        })
      }
    }
  },
  methods: {
    handleConfirm() {
      if (!this.password.trim()) {
        this.error = '비밀번호를 입력하세요'
        return
      }

      // 부모 컴포넌트에 비밀번호 전달
      this.$emit('confirm', this.password)
      this.password = ''
      this.error = ''
    },
    handleCancel() {
      this.$emit('cancel')
      this.password = ''
      this.error = ''
    },
    handleBackgroundClick() {
      // 모달 배경 클릭 시 닫기
      this.handleCancel()
    }
  }
}
</script>

<style scoped>
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 모달 박스 */
.modal-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

/* 모달 바디 */
.modal-body {
  padding: 20px;
}

.modal-message {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 모달 폼 */
.modal-form {
  padding: 0 20px 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #dc3545;
}

/* 모달 액션 버튼 */
.modal-actions {
  display: flex;
  gap: 10px;
}

button[type="submit"],
button[type="button"] {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm {
  background: #007bff;
  color: white;
}

.btn-confirm:hover {
  background: #0056b3;
}

.btn-confirm:active {
  transform: scale(0.98);
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background: #e9e9e9;
}

/* 트랜지션 애니메이션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .modal-box {
    width: 95%;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-form {
    padding: 0 16px 16px;
  }

  button[type="submit"],
  button[type="button"] {
    padding: 12px 14px;
    font-size: 14px;
  }
}
</style>