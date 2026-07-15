<template>
  <div class="post-form">
    <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>

    <!-- 1단계: 장소 선택 -->
    <div class="form-group">
      <label>장소 검색</label>
      <div class="place-search-row">
        <select v-model="categoryFilter">
          <option value="">전체 카테고리</option>
          <option value="관광지">관광지</option>
          <option value="문화시설">문화시설</option>
          <option value="레포츠">레포츠</option>
          <option value="쇼핑">쇼핑</option>
        </select>
        <input
          v-model="placeKeyword"
          type="text"
          placeholder="장소명을 검색하세요 (예: 경복궁)"
          @input="handlePlaceSearch"
        />
      </div>

      <ul v-if="placeResults.length" class="place-result-list">
        <li
          v-for="place in placeResults"
          :key="place.contentid"
          @click="selectPlace(place)"
          :class="{ selected: form.placeInfo?.contentid === place.contentid }"
        >
          <span class="place-title">{{ place.title }}</span>
          <span class="place-address">{{ place.address }}</span>
          <span class="place-category">{{ place.category }}</span>
        </li>
      </ul>

      <div v-if="form.placeInfo" class="selected-place">
        선택된 장소: <strong>{{ form.placeInfo.title }}</strong> ({{ form.placeInfo.region }} · {{ form.placeInfo.category }})
        <button type="button" class="clear-btn" @click="clearPlace">변경</button>
      </div>
    </div>

    <!-- 2단계: 게시글 내용 -->
    <div class="form-group">
      <label>제목</label>
      <input v-model="form.title" type="text" placeholder="제목을 입력하세요" />
    </div>

    <div class="form-group">
      <label>내용</label>
      <textarea v-model="form.content" rows="8" placeholder="내용을 입력하세요"></textarea>
    </div>

    <div class="form-group" v-if="!isEdit">
      <label>수정용 비밀번호</label>
      <input v-model="form.password" type="password" placeholder="숫자 4자리 이상" />
    </div>
    <p v-else class="hint">※ 수정·삭제는 등록 당시 비밀번호로 확인됩니다</p>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="form-actions">
      <button @click="handleSubmit">{{ isEdit ? '수정' : '등록' }}</button>
      <button @click="handleCancel">취소</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addPost, updatePost, getPostById } from '@/composables/usePosts'
import { searchPlaces, extractDistrict } from '@/utils/placeData'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  content: '',
  password: '',
  placeInfo: null // { contentid, title, region, category }
})

const errorMessage = ref('')
const placeKeyword = ref('')
const categoryFilter = ref('')
const placeResults = ref([])
let editAuth = null // 수정 모드일 때 sessionStorage에서 꺼낸 비밀번호

onMounted(() => {
  if (isEdit.value) {
    const existing = getPostById(Number(route.params.id))
    if (existing) {
      form.title = existing.title
      form.content = existing.content
      form.placeInfo = existing.placeInfo
    }

    // PasswordConfirmModal에서 확인 후 넘어온 비밀번호 (한 번 쓰고 즉시 삭제)
    const raw = sessionStorage.getItem('edit_auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.postId === Number(route.params.id)) {
        editAuth = parsed.password
      }
      sessionStorage.removeItem('edit_auth')
    }
  }
})

function handlePlaceSearch() {
  if (!placeKeyword.value.trim()) {
    placeResults.value = []
    return
  }
  placeResults.value = searchPlaces(
    placeKeyword.value,
    categoryFilter.value || null
  ).slice(0, 10) // 결과 너무 많지 않게 상위 10개만
}

function selectPlace(place) {
  form.placeInfo = {
    contentid: place.contentid,
    title: place.title,
    region: extractDistrict(place.address),
    category: place.category
  }
  placeResults.value = []
  placeKeyword.value = ''
}

function clearPlace() {
  form.placeInfo = null
}

function validate() {
  if (!form.placeInfo) {
    errorMessage.value = '장소를 검색해서 선택해주세요.'
    return false
  }
  if (!form.title.trim()) {
    errorMessage.value = '제목을 입력해주세요.'
    return false
  }
  if (!form.content.trim()) {
    errorMessage.value = '내용을 입력해주세요.'
    return false
  }
  if (!isEdit.value && (!form.password || form.password.length < 4)) {
    errorMessage.value = '비밀번호는 숫자 4자리 이상 입력해주세요.'
    return false
  }
  errorMessage.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return

  if (isEdit.value) {
    if (!editAuth) {
      errorMessage.value = '비밀번호 확인 정보가 없습니다. 상세 페이지에서 다시 시도해주세요.'
      return
    }
    const success = updatePost(Number(route.params.id), editAuth, {
      title: form.title,
      content: form.content,
      placeInfo: form.placeInfo
    })
    if (!success) {
      errorMessage.value = '비밀번호가 일치하지 않아 수정할 수 없습니다.'
      return
    }
    router.push({ name: 'post-detail', params: { category: form.placeInfo.category, id: route.params.id } })
  } else {
    const newPost = addPost({
      title: form.title,
      content: form.content,
      password: form.password,
      placeInfo: form.placeInfo
    })
    router.push({ name: 'post-detail', params: { category: form.placeInfo.category, id: newPost.id } })
  }
}

function handleCancel() {
  router.back()
}
</script>

<style scoped>
.post-form {
  max-width: 600px;
  margin: 0 auto;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.place-search-row {
  display: flex;
  gap: 8px;
}
.place-search-row select {
  width: 130px;
  flex-shrink: 0;
}
.place-result-list {
  list-style: none;
  margin-top: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
.place-result-list li {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}
.place-result-list li:hover,
.place-result-list li.selected {
  background: #f5f8ff;
}
.place-title {
  font-weight: 600;
}
.place-address {
  color: #888;
  flex: 1;
}
.place-category {
  color: #4a7dfc;
  font-size: 12px;
}
.selected-place {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f5f8ff;
  border-radius: 4px;
  font-size: 13px;
}
.clear-btn {
  margin-left: 8px;
  font-size: 12px;
  color: #888;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}
.hint {
  font-size: 12px;
  color: #888;
}
.error {
  color: red;
  font-size: 13px;
}
.form-actions {
  display: flex;
  gap: 8px;
}
.form-actions button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>ㄴ