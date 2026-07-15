<template>
  <article class="post-detail">
    <!-- 게시글 헤더 -->
    <div class="post-header">
      <h1 class="post-title">{{ post.title }}</h1>
      
      <!-- 메타 정보 -->
      <div class="post-meta">
        <span class="meta-item">
          <strong>작성자:</strong> {{ post.author || '익명' }}
        </span>
        <span class="meta-item">
          <strong>작성일:</strong> {{ formatDate(post.createdAt) }}
        </span>
        <span class="meta-item">
          <strong>조회:</strong> {{ post.views }}
        </span>
      </div>

      <!-- 장소 정보 (있을 경우) -->
      <div v-if="post.placeInfo" class="place-info-section">
        <div class="place-info-badge">
          <span class="place-category">{{ post.placeInfo.category }}</span>
          <span class="place-title">📍 {{ post.placeInfo.title }}</span>
          <span class="place-region">{{ post.placeInfo.region }}</span>
        </div>
      </div>
    </div>

    <!-- 게시글 본문 -->
    <div class="post-content">
      {{ post.content }}
    </div>

    <!-- 게시글 액션 바 -->
    <div class="post-footer">
      <!-- 좋아요 버튼 -->
      <button
        @click="toggleLike"
        :class="['btn-like', { liked: isLiked }]"
      >
        <span class="heart-icon">♥</span>
        {{ post.likes + (isLiked ? 1 : 0) }}
      </button>

      <!-- 수정/삭제 버튼 (본인만) -->
      <div class="action-buttons" v-if="isAuthor">
        <button @click="$emit('edit', post.id)" class="btn-edit">
          ✎ 수정
        </button>
        <button @click="$emit('delete', post.id)" class="btn-delete">
          🗑 삭제
        </button>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'PostDetail',
  props: {
    post: {
      type: Object,
      required: true,
      validator: (post) => {
        return (
          post.id &&
          post.title &&
          post.content &&
          typeof post.views === 'number' &&
          typeof post.likes === 'number' &&
          post.createdAt
        )
      }
    },
    isAuthor: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete'],
  data() {
    return {
      isLiked: false
    }
  },
  methods: {
    toggleLike() {
      this.isLiked = !this.isLiked
    },
    formatDate(timestamp) {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 게시글 헤더 */
.post-header {
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.post-title {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
}

/* 메타 정보 */
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item strong {
  color: #333;
  font-weight: 600;
}

/* 장소 정보 섹션 */
.place-info-section {
  margin-top: 16px;
}

.place-info-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 6px;
  color: white;
}

.place-category {
  display: inline-block;
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.place-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.place-region {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
}

/* 게시글 본문 */
.post-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin: 30px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 게시글 푸터 */
.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  gap: 12px;
  flex-wrap: wrap;
}

/* 좋아요 버튼 */
.btn-like {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-like:hover {
  background: #ffe6e6;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.btn-like.liked {
  background: #ffe6e6;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.heart-icon {
  font-size: 16px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 10px;
}

button[type="button"] {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .post-detail {
    padding: 20px;
  }

  .post-title {
    font-size: 22px;
  }

  .post-meta {
    flex-direction: column;
    gap: 8px;
  }

  .place-info-badge {
    flex-direction: column;
    align-items: flex-start;
  }

  .place-title {
    width: 100%;
  }

  .post-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-like,
  button[type="button"] {
    width: 100%;
    justify-content: center;
  }

  .action-buttons {
    width: 100%;
    flex-direction: row;
  }

  .action-buttons button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .post-detail {
    padding: 16px;
  }

  .post-title {
    font-size: 18px;
  }

  .post-meta {
    font-size: 12px;
  }

  .post-content {
    font-size: 14px;
    line-height: 1.6;
  }

  .place-info-badge {
    padding: 10px 12px;
    gap: 8px;
  }
}
</style>