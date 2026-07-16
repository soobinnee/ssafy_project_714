<template>
  <div class="chatbot-widget" :class="{ 'is-open': isOpen }">
    <!-- 1. 플로팅 토글 버튼 (닫혀있을 때 노출) -->
    <button
      v-if="!isOpen"
      class="chatbot-toggle-btn"
      @click="toggleChat"
      title="LocalHub AI 가이드와 대화하기"
    >
      <span class="chat-icon">💬</span>
      <span class="chat-badge">AI</span>
    </button>

    <!-- 2. 펼쳐진 대화창 화면 -->
    <div v-else class="chatbot-window">
      <!-- 헤더 -->
      <div class="chatbot-header">
        <div class="header-title">
          <span class="bot-avatar">🤖</span>
          <div class="title-text">
            <strong>LocalHub AI 가이드</strong>
            <span class="model-tag">gpt-5-mini</span>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="action-btn clear-btn"
            @click="handleClear"
            title="대화 지우기"
          >
            🗑️
          </button>
          <button
            class="action-btn close-btn"
            @click="toggleChat"
            title="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 메시지 목록 영역 -->
      <div class="chatbot-body" ref="messagesContainer">
        <!-- 시스템 메시지는 렌더링하지 않고, 유저/챗봇 메시지만 표시 -->
        <template v-for="(msg, index) in displayMessages" :key="index">
          <div
            class="message-row"
            :class="msg.role === 'user' ? 'user-row' : 'bot-row'"
          >
            <div v-if="msg.role === 'assistant'" class="bot-profile-icon">🤖</div>
            <div
              class="message-bubble"
              :class="msg.role === 'user' ? 'user-bubble' : 'bot-bubble'"
            >
              <div class="message-content" v-html="formatMessage(msg.content)"></div>
            </div>
          </div>
        </template>

        <!-- 답변 생성 중 로딩 스피너 -->
        <div v-if="isLoading" class="message-row bot-row">
          <div class="bot-profile-icon">🤖</div>
          <div class="message-bubble bot-bubble loading-bubble">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
          </div>
        </div>
      </div>

        <!-- 대화형 퀵 위자드 가이드 바 -->
        <div class="quick-wizard-bar">
          <!-- Step 1: 메인 카테고리 -->
          <div v-if="activeWizardStep === 1" class="wizard-step">
            <span class="wizard-label">💡 원하시는 가이드를 선택해 보세요:</span>
            <div class="chips-row">
              <button
                class="chip-btn primary-chip"
                @click="selectWizardCategory('tour')"
                :disabled="isLoading || isStreaming"
              >
                🏛️ 관광지 추천
              </button>
              <button
                class="chip-btn primary-chip"
                @click="selectWizardCategory('food')"
                :disabled="isLoading || isStreaming"
              >
                🍽️ 맛집·핫플
              </button>
              <button
                class="chip-btn primary-chip"
                @click="selectWizardCategory('parking')"
                :disabled="isLoading || isStreaming"
              >
                🚗 주차·웨이팅
              </button>
            </div>
          </div>

          <!-- Step 2: 후속 세부 선택지 -->
          <div v-else class="wizard-step step-two">
            <div class="wizard-header-mini">
              <span class="wizard-label">👉 {{ getCategoryTitle(selectedCategory) }} 맞춤 질문 선택:</span>
              <button class="chip-back-btn" @click="resetWizard" title="처음으로">◀ 뒤로</button>
            </div>
            <div class="chips-row">
              <button
                v-for="item in getCategoryOptions(selectedCategory)"
                :key="item.label"
                class="chip-btn action-chip"
                @click="handleQuickPrompt(item.prompt)"
                :disabled="isLoading || isStreaming"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>

      <!-- 입력바 Footer -->
      <div class="chatbot-footer">
        <textarea
          v-model="inputText"
          class="chat-input"
          placeholder="서울 나들이 장소를 편하게 물어보세요... (Shift+Enter 줄바꿈)"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          :disabled="isLoading || isStreaming"
        ></textarea>
        <button
          class="send-btn"
          @click="handleSend"
          :disabled="!inputText.trim() || isLoading || isStreaming"
          title="전송"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChatbot } from '../../composables/useChatbot.js'

const inputText = ref('')
const messagesContainer = ref(null)

const {
  isOpen,
  toggleChat,
  messages,
  isLoading,
  isStreaming,
  loadHistory,
  clearHistory,
  sendMessage
} = useChatbot()

const activeWizardStep = ref(1)
const selectedCategory = ref('')

const selectWizardCategory = (cat) => {
  selectedCategory.value = cat
  activeWizardStep.value = 2
}

const resetWizard = () => {
  activeWizardStep.value = 1
  selectedCategory.value = ''
}

const getCategoryTitle = (cat) => {
  if (cat === 'tour') return '관광지'
  if (cat === 'food') return '맛집·핫플'
  if (cat === 'parking') return '주차·웨이팅'
  return ''
}

const getCategoryOptions = (cat) => {
  if (cat === 'tour') {
    return [
      { label: '👑 종로 고궁 명소', prompt: '종로구에 있는 고궁이나 한국적인 전통 관광지 2곳 간결하게 추천해 줘.' },
      { label: '🌧️ 비오는날 실내 명소', prompt: '비 오는 날 아이나 연인과 가기 좋은 노원구 실내 명소 및 기차마을 소개해 줘.' },
      { label: '🚴 한강 야외 나들이', prompt: '한강에서 자전거 타거나 윈드서핑 할 수 있는 뚝섬 한강공원 코스 알려줘.' }
    ]
  }
  if (cat === 'food') {
    return [
      { label: '🍕 더현대·몰 맛집', prompt: '비 오는 날 가기 좋은 더현대 서울 쇼핑 및 맛집 팁 간결하게 요약해 줘.' },
      { label: '☕ 성수·연남 카페', prompt: '서울 성수동이나 연남동 핫플레이스 카페 및 실내 데이트 코스 추천해 줘.' },
      { label: '🍲 전통시장 노포 맛집', prompt: '종로 광장시장이나 서울 인기 전통시장 노포 맛집 및 먹거리 추천해 줘.' }
    ]
  }
  if (cat === 'parking') {
    return [
      { label: '🅿️ 백화점 무료주차 팁', prompt: '방금 추천해 준 더현대 서울 및 주요 백화점 주차 요금 절약 및 앱 쿠폰 팁 알려줘.' },
      { label: '🚗 한강 주차장 꿀팁', prompt: '주말 뚝섬 및 여의도 한강공원 주차장 혼잡 시간대 및 주차장 이용 팁 알려줘.' }
    ]
  }
  return []
}

const handleQuickPrompt = async (promptText) => {
  if (isLoading.value || isStreaming.value) return
  resetWizard()
  await nextTick()
  scrollToBottom()
  await sendMessage(promptText)
  await nextTick()
  scrollToBottom()
}

// role이 system인 초기 프롬프트는 화면에 표시하지 않음
const displayMessages = computed(() => {
  return messages.value.filter((m) => m.role !== 'system')
})

watch(isOpen, async (val) => {
  if (val) {
    loadHistory()
    await nextTick()
    scrollToBottom()
  }
})

const handleSend = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  const textToSend = inputText.value
  inputText.value = ''
  
  await nextTick()
  scrollToBottom()

  await sendMessage(textToSend)
  
  await nextTick()
  scrollToBottom()
}

const handleClear = () => {
  if (confirm('대화 내용을 모두 지우고 초기화하시겠습니까?')) {
    clearHistory()
    resetWizard()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 텍스트 줄바꿈 및 간단한 마크다운 효과 줄바꿈 처리
const formatMessage = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

// 새 메시지 추가 시 스크롤 하단 고정
watch(displayMessages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.chatbot-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}

/* 1. 토글 버튼 */
.chatbot-toggle-btn {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: white;
  border: none;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chatbot-toggle-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(79, 70, 229, 0.5);
}

.chat-icon {
  font-size: 26px;
}

.chat-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
}

/* 2. 대화창 컨테이너 */
.chatbot-window {
  width: 380px;
  height: 560px;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 헤더 */
.chatbot-header {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: white;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bot-avatar {
  font-size: 24px;
}

.title-text {
  display: flex;
  flex-direction: column;
}

.title-text strong {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
}

.model-tag {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 본문 영역 */
.chatbot-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f8fafc;
}

.message-row {
  display: flex;
  gap: 8px;
  max-width: 88%;
}

.user-row {
  align-self: flex-end;
  justify-content: flex-end;
}

.bot-row {
  align-self: flex-start;
}

.bot-profile-icon {
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 2px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.user-bubble {
  background-color: #3b82f6;
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.bot-bubble {
  background-color: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.message-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}

/* 로딩 애니메이션 */
.loading-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background-color: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Footer 입력 영역 */
.chatbot-footer {
  padding: 12px;
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chat-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  resize: none;
  max-height: 80px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.chat-input:focus {
  border-color: #3b82f6;
}

.chat-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.send-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.send-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

/* 모바일 전체화면 반응형 */
@media (max-width: 768px) {
  .chatbot-widget.is-open {
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
  }

  .chatbot-window {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}

/* 3. 대화형 위자드 퀵 바 스타일 */
.quick-wizard-bar {
  background-color: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  padding: 8px 12px;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wizard-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.wizard-header-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chip-back-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 6px;
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-back-btn:hover {
  background-color: #e2e8f0;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  border-radius: 14px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.chip-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #2563eb;
  transform: translateY(-1px);
}

.chip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-chip {
  background: linear-gradient(to right, #ffffff, #f8fafc);
  border-color: #94a3b8;
}

.action-chip {
  border-color: #3b82f6;
  color: #1d4ed8;
  background-color: #eff6ff;
}

.action-chip:hover:not(:disabled) {
  background-color: #dbeafe;
}
</style>