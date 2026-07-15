<template>
  <div class="chatbot-widget">
    <button class="fab" @click="open = !open" :aria-expanded="open">{{ open ? '×' : '💬' }}</button>

    <div v-if="open" class="chat-window" role="dialog" aria-label="Chatbot">
      <header class="chat-header">
        <h3>LocalHub 챗봇</h3>
        <button class="close" @click="open = false">닫기</button>
      </header>

      <main class="chat-body" ref="body">
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
          <div class="content" v-html="formatMessage(m.content)"></div>
        </div>
        <div v-if="loading" class="msg assistant">응답 생성 중...</div>
      </main>

      <footer class="chat-footer">
        <input v-model="input" @keydown.enter.prevent="handleSend" placeholder="질문을 입력하세요" />
        <button @click="handleSend" :disabled="loading || !input">전송</button>
      </footer>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { useChatbot } from '../../composables/useChatbot';

export default {
  name: 'ChatbotWidget',
  setup() {
    const open = ref(false);
    const input = ref('');
    const { loading, error, messages, init, searchPlaces, searchPosts, classifyIntent, smalltalkReply, sendToOpenAI, saveChatHistory } = useChatbot();    const body = ref(null);

    onMounted(() => {
      init();
    });

    function formatMessage(text) {
      // simple newline -> <br>
      return String(text).replace(/\n/g, '<br>');
    }

    async function handleSend() {
      if (!input.value) return;
      const userText = input.value;
      // push user message locally for UI
      messages.value.push({ role: 'user', content: userText });
      saveChatHistory();
      input.value = '';
      await nextTick();
      scrollToBottom();

      const intent = classifyIntent(userText);
      if (intent === 'smalltalk') {
        // quick rules-based reply
        const reply = smalltalkReply(userText);
        messages.value.push({ role: 'assistant', content: reply });
        saveChatHistory();
        await nextTick();
        scrollToBottom();
        return;
      }

      // place search heuristic: try local search first
      if (intent === 'place_search') {
        // simple parse: extract region/category via regex (basic)
        const regionMatch = userText.match(/(서울[^\s]*|[가-힣]+구)/);
        const categoryMatch = userText.match(/관광지|문화시설|레포츠|쇼핑/);
        const region = regionMatch ? regionMatch[0].replace('서울','').trim() : '';
        const category = categoryMatch ? categoryMatch[0] : '';
        const localResults = searchPlaces({ region, category, keyword: userText }, 3);
        if (localResults && localResults.length) {
          const listText = localResults.map((p, idx) => `${idx+1}. ${p.title} — ${p.region || p.address} (id:${p.contentid})`).join('\n');
          messages.value.push({ role: 'assistant', content: `로컬 데이터에서 찾은 결과입니다:\n${listText}\n\n출처: 한국관광공사 TourAPI` });
          saveChatHistory();
          await nextTick();
          scrollToBottom();
          return;
        }
        // if not found locally, fallthrough to OpenAI with context empty or small local hints
      }

      // fallback: send to OpenAI with some local context (recent places sample)
      const context = [];
      const samplePlaces = (searchPlaces({}, 3) || []).map(p => ({ role: 'system', content: `${p.title} | ${p.region} | ${p.category} | id:${p.contentid}` }));
      const assistantText = await sendToOpenAI(userText, samplePlaces);
      if (!assistantText) {
        // OpenAI failed: provide minimal local fallback message
        messages.value.push({ role: 'assistant', content: '일시적 오류가 발생했습니다. 로컬 데이터로는 다음을 찾았습니다.' });
      }
      await nextTick();
      scrollToBottom();
    }

    function scrollToBottom() {
      if (!body.value) return;
      body.value.scrollTop = body.value.scrollHeight;
    }

    return { open, input, messages, loading, error, handleSend, body, formatMessage };
  }
};
</script>

<style scoped>
.chatbot-widget { position: fixed; right: 20px; bottom: 20px; z-index: 1000; }
.fab { width:56px; height:56px; border-radius:50%; background:#1976d2; color:#fff; border:none; font-size:20px; }
.chat-window { width:320px; max-height:70vh; background:#fff; box-shadow:0 6px 18px rgba(0,0,0,0.2); border-radius:8px; display:flex; flex-direction:column; overflow:hidden; }
.chat-header { padding:8px 12px; background:#1976d2; color:#fff; display:flex; justify-content:space-between; align-items:center; }
.chat-body { padding:12px; overflow:auto; flex:1; background:#f7f7f7; }
.msg { margin-bottom:8px; }
.msg.user .content { background:#e1f5fe; padding:8px; border-radius:6px; display:inline-block; }
.msg.assistant .content { background:#fff; padding:8px; border-radius:6px; display:inline-block; }
.chat-footer { padding:8px; display:flex; gap:8px; align-items:center; border-top:1px solid #eee; }
.chat-footer input { flex:1; padding:8px; border:1px solid #ddd; border-radius:4px; }
.chat-footer button { padding:8px 12px; background:#1976d2; color:#fff; border:none; border-radius:4px; }
</style>