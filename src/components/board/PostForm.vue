<template>
  <form @submit.prevent="handleSubmit" class="post-form">
    <!-- 제목 -->
    <div class="form-group">
      <label for="title">제목 *</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        placeholder="게시글 제목을 입력하세요"
        required
      />
      <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
    </div>

    <!-- 작성자 -->
    <div class="form-group">
      <label for="author">작성자 *</label>
      <input
        id="author"
        v-model="form.author"
        type="text"
        placeholder="이름을 입력하세요 (익명 가능)"
        required
      />
      <span v-if="errors.author" class="error-message">{{ errors.author }}</span>
    </div>

    <!-- 비밀번호 -->
    <div class="form-group">
      <label for="password">비밀번호 * <span class="hint">(수정/삭제 시 필요)</span></label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        required
      />
      <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
    </div>

    <!-- 장소 정보 (선택사항) -->
    <div class="form-group">
      <label for="placeInfo">연관 장소 (선택사항)</label>
      <div class="place-info-display" v-if="form.placeInfo">
        <div class="place-tag">
          <span>{{ form.placeInfo.title }} ({{ form.placeInfo.category }})</span>
          <button type="button" @click="clearPlace" class="clear-btn">✕</button>
        </div>
      </div>
      <p v-else class="no-place">연관 장소를 선택하면 게시글에 추가됩니다</p>
    </div>

    <!-- 내용 -->
    <div class="form-group">
      <label for="content">내용 *</label>
      <textarea
        id="content"
        v-model="form.content"
        placeholder="게시글 내용을 입력하세요 (최소 10자)"
        rows="8"
        required
      ></textarea>
      <span v-if="errors.content" class="error-message">{{ errors.content }}</span>
      <span class="char-count">{{ form.content.length }}/2000</span>
    </div>

    <!-- 버튼 -->
    <div class="form-actions">
      <button
        type="submit"
        :disabled="!isFormValid"
        class="btn-submit"
      >
        {{ isEditMode ? '수정하기' : '작성하기' }}
      </button>
      <button type="button" @click="handleCancel" class="btn-cancel">
        취소
      </button>
    </div>
  </form>
</template>

<script>
export default {
  name: 'PostForm',
  props: {
    post: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      form: {
        title: '',
        author: '',
        password: '',
        content: '',
        placeInfo: null
      },
      errors: {}
    }
  },
  computed: {
    isEditMode() {
      return !!this.post
    },
    isFormValid() {
      return (
        this.form.title.trim().length > 0 &&
        this.form.author.trim().length > 0 &&
        this.form.password.trim().length > 0 &&
        this.form.content.trim().length >= 10 &&
        this.form.content.length <= 2000
      )
    }
  },
  mounted() {
    if (this.isEditMode) {
      this.initializeFormWithExistingPost()
    }
  },
  methods: {
    initializeFormWithExistingPost() {
      // 수정 모드: 기존 게시글 데이터로 폼 채우기
      this.form = {
        title: this.post.title || '',
        author: this.post.author || '',
        password: '', // 수정 시에는 비밀번호를 다시 입력받음
        content: this.post.content || '',
        placeInfo: this.post.placeInfo || null
      }
    },
    validateForm() {
      this.errors = {}

      if (!this.form.title.trim()) {
        this.errors.title = '제목을 입력하세요'
      }

      if (!this.form.author.trim()) {
        this.errors.author = '작성자명을 입력하세요'
      }

      if (!this.form.password.trim()) {
        this.errors.password = '비밀번호를 입력하세요'
      }

      if (!this.form.content.trim()) {
        this.errors.content = '내용을 입력하세요'
      } else if (this.form.content.trim().length < 10) {
        this.errors.content = '내용은 최소 10자 이상이어야 합니다'
      } else if (this.form.content.length > 2000) {
        this.errors.content = '내용은 2000자를 초과할 수 없습니다'
      }

      return Object.keys(this.errors).length === 0
    },
    handleSubmit() {
      if (this.validateForm()) {
        const submitData = {
          title: this.form.title.trim(),
          author: this.form.author.trim(),
          password: this.form.password,
          content: this.form.content.trim(),
          placeInfo: this.form.placeInfo
        }
        this.$emit('submit', submitData)
      }
    },
    handleCancel() {
      this.$emit('cancel')
    },
    clearPlace() {
      this.form.placeInfo = null
    }
  }
}
</script>

<style scoped>
.post-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.hint {
  font-weight: 400;
  color: #999;
  font-size: 12px;
}

input[type="text"],
input[type="password"],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="text"]:focus,
input[type="password"]:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

textarea {
  resize: vertical;
  min-height: 200px;
  line-height: 1.5;
}

.char-count {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #dc3545;
}

.place-info-display {
  padding: 12px;
  background: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 4px;
  margin-bottom: 12px;
}

.place-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border-radius: 20px;
  font-size: 13px;
}

.clear-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.clear-btn:hover {
  opacity: 0.8;
}

.no-place {
  margin: 0;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

button[type="submit"],
button[type="button"] {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit {
  background: #007bff;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #0056b3;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background: #e9e9e9;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .post-form {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  button[type="submit"],
  button[type="button"] {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .post-form {
    padding: 16px;
  }

  label {
    font-size: 13px;
  }

  input[type="text"],
  input[type="password"],
  textarea {
    font-size: 16px; /* iOS 자동 줌 방지 */
  }
}
</style>