<template>
  <div class="post-detail-view">
    <div class="detail-container">
      <button class="btn-back" @click="handleBack">← 돌아가기</button>
      
      <div v-if="post" class="post-detail-wrapper">
        <!-- 상세보기 -->
        <PostDetail
          :post="post"
          :isAuthor="isAuthor"
          @edit="handleEdit"
          @delete="showPasswordModal = true"
        />

        <!-- 댓글 목록 및 작성 -->
        <CommentList :postId="Number(route.params.id)" />

        <!-- 비밀번호 확인 모달 (삭제 클릭했을 때만 표시) -->
        <PasswordConfirmModal
          v-if="showPasswordModal"
          :postId="Number(route.params.id)"
          :category="category"
          mode="delete"
          @close="showPasswordModal = false"
          @deleted="handleDeleteConfirm"
        />
      </div>
      <div v-else class="loading">
        <p>게시글을 찾을 수 없습니다.</p>
        <button @click="handleBack" class="btn-back-text">홈으로 돌아가기</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostDetail from '../components/board/PostDetail.vue'
import PasswordConfirmModal from '../components/board/PasswordConfirmModal.vue'
import CommentList from '../components/board/CommentList.vue'
import { usePosts } from '../composables/usePosts'

export default {
  name: 'PostDetailView',
  components: {
    PostDetail,
    PasswordConfirmModal,
    CommentList
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { getPostById, increaseViews } = usePosts()

    const post = ref(null)
    const isAuthor = ref(true)  // 모든 사용자가 비밀번호로 권한 확인
    const showPasswordModal = ref(false)
    const category = ref(route.params.category)

    onMounted(() => {
      const postId = Number(route.params.id)
      post.value = getPostById(postId)

      if (post.value) {
        increaseViews(postId)
      }
    })

    const handleEdit = (postId) => {
      router.push({
        name: 'post-edit',
        params: { category: category.value, id: postId }
      })
    }

    // 모달 내부에서 비밀번호 확인 및 삭제까지 처리 완료 후 호출됨
    const handleDeleteConfirm = () => {
      alert('게시글이 삭제되었습니다.')
      router.push({
        name: 'board-list',
        params: { category: category.value }
      })
    }

    const handleBack = () => {
      router.push({ path: '/board' })
    }

    return {
      route,
      post,
      isAuthor,
      category,
      showPasswordModal,
      handleEdit,
      handleDeleteConfirm,
      handleBack
    }
  }
}
</script>

<style scoped>
.post-detail-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
}

.btn-back {
  display: inline-block;
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  transition: background 0.3s;
}

.btn-back:hover {
  background: #5a6268;
}

.post-detail-wrapper {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading p {
  font-size: 18px;
  color: #999;
  margin-bottom: 20px;
}

.btn-back-text {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 16px;
}

.btn-back-text:hover {
  background: #0056b3;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .post-detail-view {
    padding: 20px;
  }

  .post-detail-wrapper {
    padding: 30px;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .post-detail-view {
    padding: 10px;
  }

  .post-detail-wrapper {
    padding: 20px;
  }

  .btn-back {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>