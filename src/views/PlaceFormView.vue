<template>
  <div class="place-form-view">
    <div class="form-container">
      <h1 class="form-title">장소 등록</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>사진 (선택)</label>
          <div class="file-row">
            <label class="file-btn">
              파일 선택
              <input type="file" accept="image/*" class="file-input" @change="handleFileChange" />
            </label>
            <span class="file-name">{{ fileName || '선택된 파일 없음' }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>장소명 (필수)</label>
          <input v-model="title" type="text" class="text-input" required />
        </div>

        <div class="form-group">
          <label>자치구 (필수)</label>
          <select v-model="region" class="select-input" required>
            <option value="" disabled>선택</option>
            <option v-for="gu in GU_LIST" :key="gu" :value="gu">{{ gu }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>카테고리 (필수)</label>
          <select v-model="category" class="select-input" required>
            <option value="" disabled>선택</option>
            <option v-for="c in CATEGORY_LIST" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>주소 (선택)</label>
          <input v-model="address" type="text" class="text-input" />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit">등록</button>
          <button type="button" class="btn-cancel" @click="handleCancel">취소</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { addPlace } from '@/composables/usePlaces'

const router = useRouter()

const GU_LIST = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
]
const CATEGORY_LIST = ['관광지', '문화시설', '레포츠', '쇼핑']

const title = ref('')
const region = ref('')
const category = ref('')
const address = ref('')
const fileName = ref('')
const fileDataUrl = ref('')

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) {
    fileName.value = ''
    fileDataUrl.value = ''
    return
  }
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    fileDataUrl.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleSubmit() {
  if (!title.value.trim() || !region.value || !category.value) {
    alert('장소명, 자치구, 카테고리는 필수입니다.')
    return
  }

  const newPlace = addPlace({
    title: title.value.trim(),
    address: address.value.trim(),
    region: region.value,
    category: category.value,
    firstimage: fileDataUrl.value
  })

  // 등록한 명소의 상세 페이지로 이동
  router.push({
    name: 'place-detail',
    params: { category: newPlace.category, contentid: newPlace.contentid }
  })
}

function handleCancel() {
  router.push({ name: 'place-list' })
}
</script>

<style scoped>
.place-form-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.text-input,
.select-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: white;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-btn {
  display: inline-block;
  padding: 8px 14px;
  background: #f1f3f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.file-btn:hover {
  background: #e9ecef;
}

.file-input {
  display: none;
}

.file-name {
  font-size: 13px;
  color: #888;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

.btn-submit {
  padding: 10px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-submit:hover {
  background: #0056b3;
}

.btn-cancel {
  padding: 10px 24px;
  background: white;
  color: #444;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

@media (max-width: 480px) {
  .place-form-view { padding: 20px 12px; }
  .form-container { padding: 20px; }
}
</style>