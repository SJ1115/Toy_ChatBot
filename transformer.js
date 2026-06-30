const API_URL = '/api/chat';

const textInput    = document.getElementById('text-input');
const keyword1     = document.getElementById('keyword1');
const keyword2     = document.getElementById('keyword2');
const keyword3     = document.getElementById('keyword3');
const transformBtn = document.getElementById('transform-btn');
const btnText      = document.getElementById('btn-text');
const btnLoading   = document.getElementById('btn-loading');
const statusEl     = document.getElementById('status');
const outputEl     = document.getElementById('output');
const copyBtn      = document.getElementById('copy-btn');

function buildPrompt(text, kw1, kw2, kw3) {
  return `아래 텍스트를 다음 규칙에 따라 변환해줘. 변환된 텍스트만 출력하고 설명은 쓰지 마.

[변환 규칙]
1. "${kw1}"(이)라는 단어(또는 그 변형, 약칭 포함)를 "${kw2}"(으)로 교체해.
2. 텍스트 안에서 직무·역할·포지션에 해당하는 단어(예: 개발자, 디자이너, 기획자 등)를 "${kw3}"(으)로 교체해.
3. 교체 후 어색한 조사·연결어를 자연스럽게 다듬어. 단, 원문의 어조와 전체 구조는 그대로 유지해.

[원본 텍스트]
${text}`;
}

async function transform() {
  const text = textInput.value.trim();
  const kw1  = keyword1.value.trim();
  const kw2  = keyword2.value.trim();
  const kw3  = keyword3.value.trim();

  if (!text || !kw1 || !kw2 || !kw3) {
    setStatus('모든 항목을 입력해주세요.');
    return;
  }

  setLoading(true);
  outputEl.classList.add('loading');
  outputEl.textContent = '변환 중...';
  copyBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '당신은 텍스트 교정 전문가입니다. 주어진 규칙에 따라 텍스트를 정확하게 변환합니다.'
          },
          {
            role: 'user',
            content: buildPrompt(text, kw1, kw2, kw3)
          }
        ]
      })
    });

    if (!res.ok) throw new Error(`API 오류: ${res.status}`);

    const data  = await res.json();
    const reply = data.choices[0].message.content;

    outputEl.classList.remove('loading');
    outputEl.textContent = reply;
    copyBtn.disabled = false;
    setStatus('변환 완료 ✓');
  } catch (err) {
    outputEl.classList.remove('loading');
    outputEl.textContent = '';
    setStatus(`오류: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  transformBtn.disabled = on;
  btnText.hidden    =  on;
  btnLoading.hidden = !on;
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

copyBtn.addEventListener('click', async () => {
  const text = outputEl.textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyBtn.textContent = '복사됨!';
  setTimeout(() => { copyBtn.textContent = '복사'; }, 1500);
});

transformBtn.addEventListener('click', transform);

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) transform();
});
