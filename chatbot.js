const API_URL    = '/api/chat';
const MAX_TURNS  = 20;
const STORAGE_KEY = 'chatbot_history';
const SYSTEM_MSG  = { role: 'system', content: '당신은 친절한 AI 어시스턴트입니다. 이전 대화를 기억하며 자연스럽게 대화를 이어가세요.' };

// DOM
const chatPanel  = document.getElementById('chat-panel');
const messagesEl = document.getElementById('messages');
const inputEl    = document.getElementById('user-input');
const sendBtn    = document.getElementById('send-btn');
const resetBtn   = document.getElementById('reset-btn');
const fabBtn     = document.getElementById('chat-fab');
const fabOpen    = document.getElementById('fab-open');
const fabClose   = document.getElementById('fab-close');

let history = [SYSTEM_MSG];

// ── FAB 토글 ──
fabBtn.addEventListener('click', () => {
  const isOpen = chatPanel.classList.toggle('open');
  fabOpen.hidden  =  isOpen;
  fabClose.hidden = !isOpen;
  if (isOpen) inputEl.focus();
});

// ── 대화 유틸 ──
function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function trimHistory() {
  const turns = history.slice(1);
  if (turns.length > MAX_TURNS) {
    history = [SYSTEM_MSG, ...turns.slice(turns.length - MAX_TURNS)];
  }
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function loadHistory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;
  history = JSON.parse(saved);
  history.slice(1).forEach(m =>
    appendMessage(m.role === 'user' ? 'user' : 'bot', m.content)
  );
  return true;
}

// ── 전송 ──
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = '';
  sendBtn.disabled = true;

  appendMessage('user', text);
  history.push({ role: 'user', content: text });
  trimHistory();

  const loadingEl = appendMessage('loading', '답변을 생성하는 중...');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });

    if (!res.ok) throw new Error(`API 오류: ${res.status}`);

    const data = await res.json();
    const reply = data.choices[0].message.content;

    history.push({ role: 'assistant', content: reply });
    saveHistory();

    loadingEl.className = 'msg bot';
    loadingEl.textContent = reply;
  } catch (err) {
    loadingEl.className = 'msg bot';
    loadingEl.textContent = `오류가 발생했습니다: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// ── 초기화 ──
function resetChat() {
  history = [SYSTEM_MSG];
  localStorage.removeItem(STORAGE_KEY);
  messagesEl.innerHTML = '';
  appendMessage('bot', '대화가 초기화됐습니다. 새로운 대화를 시작해보세요 ☕');
}

sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) sendMessage();
});
resetBtn.addEventListener('click', resetChat);

// ── 초기 로드 ──
if (!loadHistory()) {
  appendMessage('bot', '안녕하세요! 남아공커피에 대해 무엇이든 물어보세요 ☕');
}
