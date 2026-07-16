import { ref } from 'vue'
import { STORAGE_KEYS } from '../utils/storageKeys.js'

// 전역 싱글톤 챗봇 상태 공유
const isChatOpen = ref(false)
const messages = ref([])
const isLoading = ref(false)
const isStreaming = ref(false)
const errorMessage = ref('')

// 로컬 인메모리 FAQ/응답 캐시 (로컬스토리지와 연동)
const faqCache = ref({})

export function useChatbot() {

  // 초기 기본 대화 설정 (시스템 프롬프트 + 첫 인사말)
  const initialMessages = [
    {
      role: 'system',
      content: "너는 서울 지역의 관광지, 문화시설, 레포츠, 쇼핑 장소를 안내해 주는 'LocalHub'의 친절하고 상냥한 AI 가이드야. 한국어로 답변하며, 질문 의도에 맞춰 간단한 팁은 간결하게, 일정이나 상세 추천 요청은 구조화(번호 및 문단 구분)하여 명확하고 매력적으로 설명해줘."
    },
    {
      role: 'assistant',
      content: "안녕하세요! 서울 나들이 가이드 **LocalHub AI**입니다. 🏛️🛒🎡\n궁금하신 관광지, 문화시설, 레포츠, 쇼핑 장소를 물어보시거나, 아래 **추천 질문 버튼**을 클릭해 빠른 안내를 받아보세요!"
    }
  ]

  // 1. 로컬스토리지에서 대화 히스토리 & FAQ 캐시 불러오기
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          messages.value = parsed
        } else {
          messages.value = [...initialMessages]
          saveHistory()
        }
      } else {
        messages.value = [...initialMessages]
        saveHistory()
      }

      // FAQ 캐시 로드
      const savedCache = localStorage.getItem('localhub_faq_cache')
      if (savedCache) {
        faqCache.value = JSON.parse(savedCache)
      }
    } catch (err) {
      console.error('대화 히스토리 로딩 실패:', err)
      messages.value = [...initialMessages]
    }
  }

  // 2. 로컬스토리지에 대화 히스토리 저장하기
  const saveHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages.value))
    } catch (err) {
      console.error('대화 히스토리 저장 실패:', err)
    }
  }

  // FAQ 캐시 저장
  const saveCache = () => {
    try {
      localStorage.setItem('localhub_faq_cache', JSON.stringify(faqCache.value))
    } catch (err) {
      console.error('FAQ 캐시 저장 실패:', err)
    }
  }

  // 3. 대화 초기화 (히스토리 지우기)
  const clearHistory = () => {
    messages.value = [...initialMessages]
    errorMessage.value = ''
    saveHistory()
  }

  // 4. 클라이언트 3중 필터 룰 기반 분류기 (추정 지연시간 1ms 미만, 0토큰)
  const isComplexRuleMatch = (userText) => {
    if (!userText || typeof userText !== 'string') return false
    const text = userText.trim()
    
    // 조건 1: 복합 코스/일정 설계 키워드 감지
    const keywordRegex = /(일정|코스|플랜|계획|1박|2박|3박|당일치기|동선|예산|환승|비교)/
    if (keywordRegex.test(text)) return true

    // 조건 2: 80자 이상 장문 질문
    if (text.length >= 80) return true

    // 조건 3: 조건문 연결어 2개 이상 복합 결합
    const conditionMatches = text.match(/(하고|이면서|포함해서|조건으로|대신에|그리고)/g)
    if (conditionMatches && conditionMatches.length >= 2) return true

    return false
  }

  // 5. 구조화된 컨텍스트 스냅샷 및 슬라이딩 윈도우 구성
  const prepareMessagesForApi = (allMessages) => {
    const systemPrompt = {
      role: 'system',
      content: "너는 서울 지역의 관광지, 문화시설, 레포츠, 쇼핑 장소를 안내해 주는 'LocalHub'의 친절하고 상냥한 AI 가이드야. 한국어로 답변하며, 질문 의도에 맞춰 간단한 팁은 간결하게, 일정이나 상세 추천 요청은 구조화(번호 및 문단 구분)하여 명확하고 매력적으로 설명해줘."
    }

    // 시스템 메시지 제외한 실제 대화만 필터링
    const validMessages = allMessages.filter(m => m.role === 'user' || m.role === 'assistant')

    // 최근 6개(3턴 주고받음) 이내면 원본 그대로 전송 (Sliding Window)
    if (validMessages.length <= 6) {
      return [systemPrompt, ...validMessages]
    }

    // 6개 초과 시: 최근 6개는 원본 전송 + 이전 대화는 구조화된 3~4줄 스냅샷 메모리로 압축
    const olderMessages = validMessages.slice(0, validMessages.length - 6)
    const recentMessages = validMessages.slice(-6)

    const userQueries = olderMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .slice(-3)
      .join(' / ')

    const botSummary = olderMessages
      .filter(m => m.role === 'assistant')
      .map(m => m.content.replace(/\n/g, ' ').substring(0, 45))
      .slice(-2)
      .join(' ... ')

    const snapshotContext = {
      role: 'system',
      content: `[과거 대화 구조화 스냅샷 (기억 유지용)]\n- 이전 사용자 문의 흐름: "${userQueries}"\n- 이전 추천/안내 요약: "${botSummary}"\n- 위 문맥을 참고하여 사용자가 후속 질문 시 장소명이나 제약 조건을 자연스럽게 기억하고 답변해줘.`
    }

    return [systemPrompt, snapshotContext, ...recentMessages]
  }

  // 6. 메시지 전송 및 실시간 ReadableStream(SSE) 호출
  const sendMessage = async (userText) => {
    if (!userText || !userText.trim()) return
    if (isLoading.value || isStreaming.value) return

    const trimmedText = userText.trim()
    errorMessage.value = ''

    // 사용자 메시지 추가
    messages.value.push({ role: 'user', content: trimmedText })
    saveHistory()

    // 1차: FAQ 캐시 또는 인메모리 동일 질문 확인 (10ms 즉시 반환)
    if (faqCache.value[trimmedText]) {
      isLoading.value = true
      await new Promise(r => setTimeout(r, 150)) // 가벼운 자연스러움 0.15초 대기
      isLoading.value = false
      
      const cachedReply = faqCache.value[trimmedText]
      messages.value.push({ role: 'assistant', content: '' })
      isStreaming.value = true

      // 캐시된 응답도 타자 치듯 부드럽게 스트리밍 출력
      const targetIndex = messages.value.length - 1
      const chars = cachedReply.split('')
      for (let i = 0; i < chars.length; i += 3) {
        messages.value[targetIndex].content += chars.slice(i, i + 3).join('')
        await new Promise(r => setTimeout(r, 8))
      }
      isStreaming.value = false
      saveHistory()
      return
    }

    // VITE_USE_SAMPLE 시뮬레이션
    const useSample = import.meta.env.VITE_USE_SAMPLE === 'true' || import.meta.env.VITE_USE_SAMPLE === true
    if (useSample) {
      isLoading.value = true
      await new Promise(r => setTimeout(r, 600))
      isLoading.value = false

      const sampleReply = `[샘플 모드 응답] '${trimmedText}'에 대한 안내입니다!\n서울시 주요 관광지와 명소(경복궁, 더현대 서울, 뚝섬 한강공원 등)를 편하게 탐색해 보세요. 😊`
      messages.value.push({ role: 'assistant', content: '' })
      isStreaming.value = true

      const targetIndex = messages.value.length - 1
      const chars = sampleReply.split('')
      for (let i = 0; i < chars.length; i += 2) {
        messages.value[targetIndex].content += chars.slice(i, i + 2).join('')
        await new Promise(r => setTimeout(r, 10))
      }
      isStreaming.value = false
      saveHistory()
      return
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
      errorMessage.value = 'OpenAI API 키가 설정되지 않았습니다. .env 파일의 VITE_OPENAI_API_KEY를 확인해주세요.'
      messages.value.push({
        role: 'assistant',
        content: `⚠️ **오류 발생:** OpenAI API 키가 설정되지 않았습니다.`
      })
      saveHistory()
      return
    }

    // 2차: 정교한 API 호출 준비 (스트리밍 및 가변 추론 제어)
    const modelName = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini'
    const isComplex = isComplexRuleMatch(trimmedText)
    const reasoningEffort = isComplex ? 'medium' : 'low'

    // 전송 전 입력 메시지 배열 (최근에 추가된 사용자 메시지 포함)
    const apiMessages = prepareMessagesForApi(messages.value)

    isLoading.value = true

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          temperature: 1,
          stream: true,
          reasoning_effort: reasoningEffort
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const serverMsg = errData.error?.message || response.statusText
        if (response.status === 401) {
          throw new Error('OpenAI API 키가 유효하지 않습니다 (401 Unauthorized).')
        } else if (response.status === 429) {
          throw new Error('API 호출 한도 또는 예산(Rate Limit/Quota)을 초과했습니다 (429 Too Many Requests).')
        } else {
          throw new Error(`API 호출 실패 (${response.status}): ${serverMsg}`)
        }
      }

      // 스트리밍 시작 (첫 토큰 수신)
      isLoading.value = false
      isStreaming.value = true

      // 챗봇 응답 메시지 플레이스홀더 생성
      messages.value.push({ role: 'assistant', content: '' })
      const targetIndex = messages.value.length - 1

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 마지막 미완성 줄은 버퍼에 보존

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue
          const jsonStr = trimmedLine.replace('data: ', '').trim()
          if (jsonStr === '[DONE]') break

          try {
            const parsed = JSON.parse(jsonStr)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            if (delta) {
              messages.value[targetIndex].content += delta
            }
          } catch (e) {
            // 청크 파싱 오류 무시
          }
        }
      }

      // 최종 완성된 텍스트 캐시 저장
      const completedReply = messages.value[targetIndex].content
      if (completedReply && completedReply.trim().length > 0) {
        faqCache.value[trimmedText] = completedReply
        saveCache()
      }
      saveHistory()

    } catch (err) {
      console.error('OpenAI 스트리밍 통신 오류:', err)
      isLoading.value = false
      errorMessage.value = err.message || '알 수 없는 오류가 발생했습니다.'
      messages.value.push({
        role: 'assistant',
        content: `⚠️ **오류 발생:** ${err.message}\n(잠시 후 다시 시도하시거나 .env 설정을 확인해 주세요.)`
      })
      saveHistory()
    } finally {
      isLoading.value = false
      isStreaming.value = false
    }
  }

  const toggleChat = () => {
    isChatOpen.value = !isChatOpen.value
  }

  return {
    isOpen: isChatOpen,
    toggleChat,
    messages,
    isLoading,
    isStreaming,
    errorMessage,
    faqCache,
    loadHistory,
    clearHistory,
    sendMessage
  }
}
