<template>
  <div class="post-form">
    <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>

    <form @submit.prevent="onSubmit">
      <label>
        카테고리
        <select v-model="form.placeInfo.category" required>
          <option value="">선택</option>
          <option value="관광지">관광지</option>
          <option value="문화시설">문화시설</option>
          <option value="레포츠">레포츠</option>
          <option value="쇼핑">쇼핑</option>
        </select>
      </label>

      <label>
        제목
        <input type="text" v-model="form.title" maxlength="100" required />
      </label>

      <label>
        작성자 (선택, 비워두면 '익명'으로 등록)
        <input type="text" v-model="form.author" maxlength="20" placeholder="익명" />
      </label>

      <label>
        내용
        <textarea v-model="form.content" rows="8" required></textarea>
      </label>

      <label>
        수정/삭제 비밀번호 (4자 이상)
        <input type="password" v-model="inputPassword" minlength="4" required />
      </label>

      <fieldset>
        <legend>장소 정보 (필수)</legend>
        <label>
          장소명
          <input type="text" v-model="form.placeInfo.title" required />
        </label>
        <label>
          지역
          <select v-model="form.placeInfo.region" required>
            <option value="">선택</option>
            <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>
      </fieldset>

      <div class="actions">
        <button type="submit">{{ isEdit ? '수정 완료' : '등록' }}</button>
        <button type="button" @click="onCancel">취소</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addPost, updatePost, getPostById } from '@/composables/usePosts'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id
const id = isEdit ? Number(route.params.id) : null

const inputPassword = ref('')
const error = ref('')
const success = ref('')

const regions = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]

const form = reactive({
  title: '',
  content: '',
  author: '',
  placeInfo: {
    title: '',
    region: '',
    category: route.query.category || ''
  }
})

const DRAFT_KEY = 'localhub_post_draft'

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    form.title = d.title || ''
    form.content = d.content || ''
    form.author = d.author || ''
    if (d.placeInfo) {
      form.placeInfo.title = d.placeInfo.title || ''
      form.placeInfo.region = d.placeInfo.region || ''
      form.placeInfo.category = d.placeInfo.category || form.placeInfo.category
    }
  } catch {}
}

function saveDraft() {
  try {
    const d = {
      title: form.title,
      content: form.content,
      author: form.author,
      placeInfo: form.placeInfo,
      lastSavedAt: Date.now()
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {}
}

let draftTimer = null

onMounted(() => {
  if (isEdit && id !== null) {
    const post = getPostById(id)
    if (!post) {
      error.value = '해당 게시글을 찾을 수 없습니다.'
      return
    }
    form.title = post.title
    form.content = post.content
    form.author = post.author || ''
    form.placeInfo = {
      title: post.placeInfo?.title || '',
      region: post.placeInfo?.region || '',
      category: post.placeInfo?.category || ''
    }
    // editing: don't autofill password
  } else {
    loadDraft()
    draftTimer = setInterval(saveDraft, 1500)
  }
})

onBeforeUnmount(() => {
  if (draftTimer) clearInterval(draftTimer)
})

async function onSubmit() {
  error.value = ''
  success.value = ''

  if (!form.title.trim() || !form.content.trim()) {
    error.value = '제목과 내용을 입력해 주세요.'
    return
  }
  if (!form.placeInfo.category) {
    error.value = '카테고리를 선택해 주세요.'
    return
  }
  if (!form.placeInfo.title.trim()) {
    error.value = '장소명을 입력해 주세요.'
    return
  }
  if (!form.placeInfo.region) {
    error.value = '지역을 선택해 주세요.'
    return
  }
  if (!inputPassword.value || inputPassword.value.length < 4) {
    error.value = '비밀번호는 4자 이상 입력해 주세요.'
    return
  }

  if (isEdit) {
    const ok = updatePost(id, inputPassword.value, {
      title: form.title,
      content: form.content,
      author: form.author,
      placeInfo: { ...form.placeInfo }
    })
    if (!ok) {
      error.value = '비밀번호가 일치하지 않거나 수정에 실패했습니다.'
      return
    }
    localStorage.removeItem(DRAFT_KEY)
    success.value = '게시글이 수정되었습니다.'
    setTimeout(() => {
      router.replace({ name: 'post-detail', params: { id } })
    }, 600)
  } else {
    const newPost = addPost({
      title: form.title,
      content: form.content,
      password: inputPassword.value,
      author: form.author,
      placeInfo: { ...form.placeInfo }
    })
    localStorage.removeItem(DRAFT_KEY)
    success.value = '게시글이 등록되었습니다.'
    setTimeout(() => {
      // 등록 후에는 상세/카테고리 페이지가 아니라 전체 게시판으로 바로 이동
      router.replace({ path: '/board' })
    }, 600)
  }
}

function onCancel() {
  router.back()
}
</script>

<style scoped>
.post-form {
  max-width: 760px;
  margin: 24px auto;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}
input[type="text"],
input[type="password"],
select,
textarea {
  width: 100%;
  padding: 8px;
  margin-top: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
fieldset {
  margin: 12px 0;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #eee;
}
.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button[type="submit"] { background: #2b6cb0; color: #fff; }
button[type="button"] { background: #eee; }
.error { color: #d32f2f; margin-top: 8px; }
.success { color: #2e7d32; margin-top: 8px; }
</style>