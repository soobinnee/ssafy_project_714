<template>
  <div class="home-banner" :style="{ backgroundImage: `url(${backgroundImage})` }">
    <div class="banner-overlay"></div>
    <div class="banner-content">
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeBanner',
  props: {
    title: {
      type: String,
      default: '여행 가이드'
    },
    subtitle: {
      type: String,
      default: '대한민국의 아름다운 여행지를 발견하세요'
    },
    backgroundImage: {
      type: String,
      default: 'https://via.placeholder.com/1200x500'
    }
  }
}
</script>

<style scoped>
.home-banner {
  height: 50vh;
  min-height: 400px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.banner-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  z-index: 10;
  padding: 20px;
}

.banner-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  word-break: keep-all;
}

.banner-content p {
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  word-break: keep-all;
}

/* 태블릿 반응형 */
@media (max-width: 768px) {
  .home-banner {
    height: 40vh;
    min-height: 300px;
  }

  .banner-content h1 {
    font-size: 2rem;
    margin-bottom: 15px;
  }

  .banner-content p {
    font-size: 1rem;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .home-banner {
    height: 35vh;
    min-height: 250px;
  }

  .banner-content h1 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .banner-content p {
    font-size: 0.9rem;
  }

  .banner-overlay {
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>