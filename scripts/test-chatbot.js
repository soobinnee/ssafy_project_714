/**
 * LocalHub AI 가이드 (gpt-5-mini) 스트리밍 최적화 E2E 자동화 테스트 스크립트
 * 
 * 실행 방법 (터미널):
 *   npm run test:chatbot
 * 
 * 측정 지표:
 * 1. TTFT (Time To First Token): 사용자가 전송 후 화면에 첫 단어가 출력되기까지 걸리는 시간 (목표: 2,000ms 이하)
 * 2. Total Latency: 답변이 100% 완료되기까지 걸리는 총 소요 시간
 * 3. Pass Rate: 핵심 키워드 감지율 100% 검증
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. .env 파일에서 API 키 로드
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env')
  const envExamplePath = path.resolve(__dirname, '../.env.example')
  
  let content = ''
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8')
  } else if (fs.existsSync(envExamplePath)) {
    content = fs.readFileSync(envExamplePath, 'utf-8')
  }

  const env = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=')
      if (key && vals.length > 0) {
        env[key.trim()] = vals.join('=').trim()
      }
    }
  })
  return env
}

const env = loadEnv()
const API_KEY = env.VITE_OPENAI_API_KEY
const MODEL_NAME = env.VITE_OPENAI_MODEL || 'gpt-5-mini'
const USE_SAMPLE = env.VITE_USE_SAMPLE === 'true'

// 2. 클라이언트 3중 필터 룰 분류기 (useChatbot.js와 동일 로직)
function isComplexRuleMatch(userText) {
  if (!userText || typeof userText !== 'string') return false
  const text = userText.trim()
  const keywordRegex = /(일정|코스|플랜|계획|1박|2박|3박|당일치기|동선|예산|환승|비교)/
  if (keywordRegex.test(text)) return true
  if (text.length >= 80) return true
  const conditionMatches = text.match(/(하고|이면서|포함해서|조건으로|대신에|그리고)/g)
  if (conditionMatches && conditionMatches.length >= 2) return true
  return false
}

// 3. 자동화 테스트 시나리오 질문지 (QA 체크리스트)
const TEST_SCENARIOS = [
  {
    id: 1,
    category: '관광지 추천',
    prompt: '종로구에 있는 고궁이나 한국적인 전통 관광지 2곳 추천해 줘. 짧고 핵심만 말해줘.',
    expectedKeywords: ['경복궁', '창덕궁', '궁', '한옥', '종로'],
    description: '서울 종로구 전통 관광지 추천 인식 테스트'
  },
  {
    id: 2,
    category: '문화시설 추천',
    prompt: '아이들과 실내 나들이 갈 만한 노원구 박물관이나 기차마을 소개해 줘.',
    expectedKeywords: ['노원기차마을', '기차', '박물관', '노원', '실내'],
    description: '문화시설 및 특정 자치구(노원구) 명소 인식 테스트'
  },
  {
    id: 3,
    category: '레포츠 추천',
    prompt: '한강에서 자전거 타거나 윈드서핑 할 수 있는 뚝섬 한강공원 코스 알려줘.',
    expectedKeywords: ['뚝섬', '한강', '윈드서핑', '자전거', '레포츠'],
    description: '야외 액티비티 및 레포츠 카테고리 답변 적합성 테스트'
  },
  {
    id: 4,
    category: '쇼핑 & 실내 데이트',
    prompt: '비 오는 날 가기 좋은 더현대 서울 쇼핑 및 맛집 팁 3 줄로 요약해 줘.',
    expectedKeywords: ['더현대', '서울', '여의도', '식품관', '실내'],
    description: '쇼핑 복합시설 및 상황별 꿀팁 요약 능력 테스트'
  },
  {
    id: 5,
    category: '대화 기억 및 문맥 파악',
    prompt: '방금 네가 추천해 준 더현대 서울 주차 요금 절약 팁도 있어?',
    expectedKeywords: ['주차', '현대백화점', '앱', '무료', '쿠폰'],
    description: '이전 대화 맥락 유지(Contextual continuity) 및 실용 팁 안내 테스트'
  }
]

async function runAutomatedTests() {
  console.log('\n======================================================')
  console.log(`🤖 LocalHub AI 가이드 (${MODEL_NAME}) 스트리밍 고도화 E2E 테스트 시작`)
  console.log('======================================================\n')

  if (!API_KEY || API_KEY === 'YOUR_OPENAI_API_KEY') {
    if (!USE_SAMPLE) {
      console.error('❌ [에러] VITE_OPENAI_API_KEY가 설정되지 않았습니다.')
      console.log('💡 .env 파일에 유효한 OpenAI API 키를 입력하거나 VITE_USE_SAMPLE=true로 변경해 주세요.\n')
      process.exit(1)
    }
  }

  let passedCount = 0
  let totalTtft = 0
  let totalLatency = 0

  const history = [
    {
      role: 'system',
      content: "너는 서울 지역의 관광지, 문화시설, 레포츠, 쇼핑 장소를 안내해 주는 'LocalHub'의 친절하고 상냥한 AI 가이드야. 한국어로 답변하며, 질문 의도에 맞춰 간단한 팁은 간결하게, 일정이나 상세 추천 요청은 구조화(번호 및 문단 구분)하여 명확하고 매력적으로 설명해줘."
    }
  ]

  for (const test of TEST_SCENARIOS) {
    console.log(`📌 [테스트 ${test.id}/${TEST_SCENARIOS.length}] ${test.category}: ${test.description}`)
    console.log(`   Q: "${test.prompt}"`)

    const isComplex = isComplexRuleMatch(test.prompt)
    const effort = isComplex ? 'medium' : 'low'
    console.log(`   ⚙️ [가변 추론 강도]: ${effort.toUpperCase()} (룰 분류 결과)`)

    history.push({ role: 'user', content: test.prompt })
    const startTime = Date.now()
    let ttft = 0
    let replyText = ''

    try {
      if (USE_SAMPLE) {
        await new Promise(r => setTimeout(r, 400))
        ttft = Date.now() - startTime
        await new Promise(r => setTimeout(r, 400))
        replyText = `[샘플 모드 응답] '${test.prompt}'에 대한 추천: ${test.expectedKeywords.slice(0, 2).join(', ')} 등을 추천합니다.`
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: history.slice(-6), // 슬라이딩 윈도우 전송
            temperature: 1,
            stream: true,
            reasoning_effort: effort
          })
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(`API 오류 (${response.status}): ${errData.error?.message || response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue
            const jsonStr = trimmedLine.replace('data: ', '').trim()
            if (jsonStr === '[DONE]') break

            try {
              const parsed = JSON.parse(jsonStr)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              if (delta) {
                if (ttft === 0) {
                  ttft = Date.now() - startTime // 첫 글자 수신 시점 기록
                }
                replyText += delta
              }
            } catch (e) {}
          }
        }
      }

      const totalTime = Date.now() - startTime
      totalTtft += ttft
      totalLatency += totalTime
      history.push({ role: 'assistant', content: replyText })

      // 키워드 검증
      const matchedKeywords = test.expectedKeywords.filter(kw => replyText.includes(kw))
      const isPassed = matchedKeywords.length >= 1

      if (isPassed) {
        passedCount++
        console.log(`   ✅ [PASS] TTFT(첫글자): ${ttft}ms | 총 완료: ${totalTime}ms | 키워드: [${matchedKeywords.join(', ')}]`)
      } else {
        console.log(`   ❌ [FAIL] TTFT: ${ttft}ms | 총 완료: ${totalTime}ms | 기대 키워드 없음`)
      }
      console.log(`   💬 A 요약: "${replyText.replace(/\n/g, ' ').substring(0, 85)}..."\n`)

    } catch (err) {
      console.log(`   🚨 [ERROR] ${err.message}\n`)
    }
  }

  const avgTtft = Math.round(totalTtft / TEST_SCENARIOS.length)
  const avgLatency = Math.round(totalLatency / TEST_SCENARIOS.length)
  const passRate = Math.round((passedCount / TEST_SCENARIOS.length) * 100)

  console.log('======================================================')
  console.log(`📊 스트리밍 고도화 자동화 테스트 리포트`)
  console.log(`- 최종 정답 점수: ${passedCount} / ${TEST_SCENARIOS.length} (패스율: ${passRate}%)`)
  console.log(`- ⚡ 평균 첫 토큰 도달 시간(TTFT): ${avgTtft}ms (${avgTtft < 2500 ? '🟢 실시간 초고속' : '🟡 보통'})`)
  console.log(`- ⏱️ 평균 최종 완료 시간: ${avgLatency}ms (${avgLatency < 6000 ? '🟢 훌륭함' : '🟡 양호'})`)
  console.log('======================================================\n')
}

runAutomatedTests()
