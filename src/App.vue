<template>
  <div id="app">
    <AppHeader />

    <main class="app-content">
      <router-view />
    </main>

    <ChatbotWidget />
  </div>
</template>

<script setup>
import AppHeader from './components/layout/AppHeader.vue'
import ChatbotWidget from './components/layout/ChatbotWidget.vue'
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}
</style>