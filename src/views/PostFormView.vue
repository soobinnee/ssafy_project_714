<template>
  <div class="post-form-view">
    <div class="form-container">
      <h1>{{ isEditMode ? '게시글 수정' : '새 게시글 작성' }}</h1>
      
      <PostForm
        :post="currentPost"
        :category="category"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostForm from '../components/board/PostForm.vue'
import { usePosts } from '../composables/usePosts'

export default {
  name: 'PostFormView',
  components: {
    PostForm
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { getPostById, createPost, updatePost } = usePosts()

    const currentPost = ref(null)
    const category = ref(route.params.category)

    const isEditMode = computed(() => !!route.params.id)

    onMounted(() => {
      if (isEditMode.value) {
        const postId = Number(route.params.id)
        const post = getPostById(postId)
        if (post) {
          currentPost.value = post
        } else {
          alert('게시글을 찾을 수 없습니다.')
          router.back()
        }
      }
    })

    const handleSubmit = (formData) => {
      try {
        if (isEditMode.value) {
          // 수정 모드
          updatePost(Number(route.params.id), formData)
          alert('게시글이 수정되었습니다.')
          router.push({
            name: 'post-detail',
            params: { category: category.value, id: route.params.id }
          })
        } else {
          // 작성 모드
          const newPost = createPost(formData)
          alert('게시글이 등록되었습니다.')
          router.push({
            name: 'post-detail',
            params: { category: category.value, id: newPost.id }
          })
        }
      } catch (error) {
        alert('오류가 발생했습니다: ' + error.message)
      }
    }

    const handleCancel = () => {
      if (window.confirm('작성을 취소하시겠습니까?')) {
        router.back()
      }
    }

    return {
      currentPost,
      category,
      isEditMode,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.post-form-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-container h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .form-container {
    padding: 30px;
  }

  .form-container h1 {
    font-size: 24px;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .post-form-view {
    padding: 15px;
  }

  .form-container {
    padding: 20px;
  }

  .form-container h1 {
    font-size: 20px;
    margin-bottom: 20px;
  }
}
</style>