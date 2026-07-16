<template>
  <div class="place-add-form">
    <h2>장소 등록</h2>

    <form @submit.prevent="onSubmit" class="form-card">
      <label>
        사진 (선택)
        <input type="file" accept="image/*" @change="onFileChange" />
      </label>

      <label>
        장소명 (필수)
        <input type="text" v-model="form.title" required />
      </label>

      <label>
        자치구 (필수)
        <select v-model="form.region" required>
          <option value="">선택</option>
          <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>

      <label>
        카테고리 (필수)
        <select v-model="form.category" required>
          <option value="">선택</option>
          <option value="관광지">관광지</option>
          <option value="문화시설">문화시설</option>
          <option value="레포츠">레포츠</option>
          <option value="쇼핑">쇼핑</option>
        </select>
      </label>

      <label>
        주소 (선택)
        <input type="text" v-model="form.address" />
      </label>

      <div class="actions">
        <button type="submit">등록</button>
        <button type="button" @click="onCancel">취소</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { addPlace as addPlaceToCache } from '@/composables/usePlaces'

const router = useRouter()
const regions = [
  '강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구',
  '노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구',
  '성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'
]

const form = reactive({
  title: '',
  address: '',
  region: '',
  category: '',
  // 사진은 dataURL로 저장
  firstimage: ''
})

const error = ref('')
const success = ref('')

function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.firstimage = reader.result // data URL
  }
  reader.readAsDataURL(file)
}

function validate() {
  if (!form.title.trim()) { error.value = '장소명을 입력하세요.'; return false }
  if (!form.region) { error.value = '자치구를 선택하세요.'; return false }
  if (!form.category) { error.value = '카테고리를 선택하세요.'; return false }
  error.value = ''
  return true
}

function onSubmit() {
  if (!validate()) return
  const added = addPlaceToCache({
    title: form.title.trim(),
    address: form.address.trim(),
    region: form.region,
    category: form.category,
    firstimage: form.firstimage
  })
  success.value = '장소가 등록되었습니다.'
  // 등록 후 목록으로 이동 (BoardListView가 getPlacesLite로 읽어오므로 새로고침 없이 바로 반영되지 않을 수 있음)
  // 강제로 목록에서 재로드하려면 router.push로 목록으로 이동
  setTimeout(() => {
    router.push({ name: 'board-list' })
  }, 700)
}

function onCancel() {
  router.back()
}
</script>

<style scoped>
.form-card { max-width:760px; margin:24px auto; padding:18px; background:#fff; border-radius:8px; }
label { display:block; margin-bottom:12px; }
input[type="text"], select, textarea { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; }
.actions { display:flex; gap:8px; margin-top:12px; }
button { padding:8px 12px; border-radius:6px; cursor:pointer; }
button[type="submit"] { background:#2563eb; color:#fff; border:none; }
.error { color:#d32f2f; }
.success { color:#2e7d32; }
</style>