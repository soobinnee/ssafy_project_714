import { createApp } from 'vue'
import App from './App.vue'
import router from './router'


//테스트_코드_예시
async function seedLocalData() {
  if (import.meta.env.VITE_USE_SAMPLE !== 'true') return
  if (localStorage.getItem('posts')) return
  try {
    const r = await fetch('/sample/mock-posts.json')
    if (!r.ok) {
      console.warn('샘플 데이터 불러오기 실패', r.status)
      return
    }
    const posts = await r.json()
    localStorage.setItem('posts', JSON.stringify(posts))
    console.info('샘플 데이터 시드 완료:', Array.isArray(posts) ? posts.length + ' posts' : 'ok')
  } catch (e) {
    console.warn('샘플 데이터 시드 실패', e)
  }
}

;(async () => {
  if (import.meta.env.MODE !== 'production') {
    await seedLocalData()
  }

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})()