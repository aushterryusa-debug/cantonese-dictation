import { ITEMS, itemsForMode, isCantoneseVoice, getCounts, toSpokenText, isPunctuationChar } from './content.js';

const $ = id => document.getElementById(id);
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let mode = 'words';
let items = [];
let index = 0;
let marks = new Map();
let revealed = new Set();
let hinted = new Set();
let wrongChars = new Map(); // item.id -> Set of char indices tapped as wrong
let correctedOnPaper = new Set(); // item.id -> practiced 3x on paper
let manual = false;
let selectedVoice = null;
let voices = [];
let currentUtterance = null;
let speechToken = 0;
let playing = false;
let paused = false;
let phase = 'setup';

const labels = { words: '詞語練習', sentences: '段落逐句默', all: '全部練習' };
const PUNCT_NAMES = { '：': '冒號「：」', '「': '開引號「「」', '」': '關引號「」」', '，': '逗號「，」', '。': '句號「。」', '！': '感嘆號「！」', '？': '問號「？」' };

function status(text) {
  $('speech-status').textContent = text;
}

function setSpeaking(value, isPaused = false) {
  playing = value;
  paused = isPaused;
  $('practice').classList.toggle('speaking', value && !isPaused);
  $('pause').disabled = !value;
  $('pause').textContent = isPaused ? '繼續' : '暫停';
}

function stopSpeech() {
  speechToken++;
  if (synth) {
    try {
      if (synth.paused) synth.resume();
      synth.cancel();
    } catch {}
  }
  currentUtterance = null;
  setSpeaking(false);
}

function showPhase(next) {
  phase = next;
  ['setup', 'practice', 'summary'].forEach(id => { $(id).hidden = id !== next; });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderStudyDeck() {
  const host = $('study-cards');
  if (!host) return;
  host.replaceChildren();
  ITEMS.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'study-card';
    const head = document.createElement('div');
    head.className = 'study-card-head';
    const word = document.createElement('span');
    word.className = 'study-card-word' + (item.kind === 'sentence' ? ' is-sent' : '');
    word.textContent = item.kind === 'sentence' ? `句 ${idx - 7}：${item.text}` : item.text;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'study-speak-btn';
    btn.textContent = '🔊 聽讀音';
    btn.disabled = !selectedVoice;
    btn.addEventListener('click', () => {
      speak(item.text, { slow: false, test: true, customLabel: `正在讀：「${item.text}」`, speakPunct: item.kind === 'sentence' });
    });
    head.append(word, btn);
    const tip = document.createElement('p');
    tip.className = 'study-card-tip';
    tip.textContent = `💡 ${item.tip || ''}`;
    card.append(head, tip);
    host.append(card);
  });
}

function refreshVoices() {
  const oldURI = selectedVoice?.voiceURI;
  const rawVoices = synth ? synth.getVoices() : [];
  voices = rawVoices
    .filter(isCantoneseVoice)
    .sort((a, b) => Number(Boolean(b.localService)) - Number(Boolean(a.localService)));
  selectedVoice = voices.find(v => v.voiceURI === oldURI) || voices[0] || null;

  $('voice-select').replaceChildren();
  if (voices.length) {
    voices.forEach(v => {
      const option = document.createElement('option');
      option.value = v.voiceURI;
      option.textContent = `${v.name} · ${v.lang}${v.localService ? ' · 裝置聲音' : ''}`;
      option.selected = v === selectedVoice;
      $('voice-select').append(option);
    });
  } else {
    const option = document.createElement('option');
    option.textContent = '未搵到粵語聲音';
    $('voice-select').append(option);
  }

  $('voice-select').disabled = !selectedVoice;
  $('start').disabled = !selectedVoice;
  $('test-voice').disabled = !selectedVoice;
  $('voice-dot').classList.toggle('ready', Boolean(selectedVoice));
  $('voice-title').textContent = selectedVoice ? `已搵到粵語聲音（共 ${voices.length} 把）` : '呢個瀏覽器未提供粵語聲音';
  $('voice-info').textContent = selectedVoice
    ? '先試聽，確認讀音同音量適合。只會使用粵語（zh-HK／yue）聲音，絕唔會自動改用普通話。'
    : '唔會改用普通話。可喺裝置嘅語音設定加入粵語（香港）後按「重新檢查」，或選下面「由大人讀，照樣練習」。';

  renderStudyDeck();

  if (phase === 'practice' && !manual) {
    $('play').disabled = !selectedVoice;
    $('slow').disabled = !selectedVoice;
    document.querySelectorAll('.clause-btn').forEach(b => { b.disabled = !selectedVoice; });
    if (!selectedVoice) status('粵語聲音暫時未能使用。可以睇答案由大人讀，或返回重新檢查。');
  }
}

function speak(rawText, opts = {}) {
  const { slow = false, test = false, speakPunct = false, customLabel = '' } = opts;
  if (!synth || !selectedVoice) {
    if (!test) status('搵唔到粵語聲音。請返回選擇頁重新檢查，或由大人讀。');
    return;
  }
  stopSpeech();
  const token = speechToken;
  const spoken = toSpokenText(rawText, speakPunct);
  const utterance = new SpeechSynthesisUtterance(spoken);
  currentUtterance = utterance;
  utterance.voice = selectedVoice;
  utterance.lang = selectedVoice.lang;
  utterance.rate = slow ? 0.58 : 0.82;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (!test) {
    $('play').textContent = '↻ 再讀一次';
    status(customLabel || (slow ? '準備慢讀…' : '準備朗讀…'));
  } else {
    $('voice-info').textContent = customLabel || '正在試聽：「準備好紙同筆，我哋一齊默書啦。」';
  }

  utterance.onstart = () => {
    if (token !== speechToken) return;
    if (!test) {
      setSpeaking(true, false);
      status(slow ? '慢慢聽，再喺紙上慢慢寫。' : '留心聽，寫好先按核對答案。');
    }
  };
  utterance.onend = () => {
    if (token !== speechToken) return;
    currentUtterance = null;
    setSpeaking(false, false);
    if (!test) status('讀完喇。喺紙上慢慢寫，需要時可以按「再讀一次」或「慢讀」。');
    else $('voice-info').textContent = '試聽完喇。如果係清楚粵語，就可以開始默書。';
  };
  utterance.onerror = event => {
    if (token !== speechToken || event.error === 'canceled' || event.error === 'interrupted') return;
    setSpeaking(false, false);
    currentUtterance = null;
    const message = '朗讀未成功。請檢查媒體音量，再按重播；亦可以由大人讀。';
    if (test) $('voice-info').textContent = message;
    else status(message);
  };
  synth.speak(utterance);
}

function renderCorrectionCoach(item) {
  const coach = $('correction-coach');
  const body = $('coach-body');
  const doneBtn = $('coach-done');
  const pickedIdx = wrongChars.get(item.id);
  const isRetry = marks.get(item.id) === 'retry';
  const hasPicked = pickedIdx && pickedIdx.size > 0;

  if (!isRetry && !hasPicked) {
    coach.hidden = true;
    return;
  }
  coach.hidden = false;
  const chars = [...item.text];
  const missedLabels = hasPicked
    ? [...pickedIdx].sort((a, b) => a - b).map(idx => {
        const ch = chars[idx];
        if (isPunctuationChar(ch)) return PUNCT_NAMES[ch] || `標點「${ch}」`;
        const trap = item.traps?.[ch];
        return trap ? `「${ch}」（${trap}）` : `「${ch}」`;
      })
    : [];

  if (missedLabels.length) {
    body.textContent = `你標記咗 ${missedLabels.join('、')}。請喺默書紙隔離空白位，望住上面田字格慢慢寫啱 3 次，寫好撳下面按鈕確認！`;
  } else {
    body.textContent = item.kind === 'word'
      ? `請喺默書紙隔離空白位，望住上面田字格將「${item.text}」慢慢寫啱 3 次（${item.tip || ''}），寫邊筆記邊筆！`
      : `請望清上面句子入面寫錯嘅字同標點，喺紙上空白位將錯字慢慢改正 3 次（${item.tip || ''}）！`;
  }

  const done = correctedOnPaper.has(item.id);
  doneBtn.classList.toggle('done', done);
  doneBtn.textContent = done ? '✓ 好叻！已喺紙上改正 3 次（完成後會再考你一次）' : '✓ 我已經喺紙上認真改正 3 次';
}

function renderCharGrid(item) {
  const grid = $('char-grid');
  grid.replaceChildren();
  grid.classList.toggle('is-sentence', item.kind === 'sentence');
  const chars = [...item.text];
  const picked = wrongChars.get(item.id) || new Set();

  chars.forEach((ch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isPunct = isPunctuationChar(ch);
    const isWrong = picked.has(idx);
    btn.className = 'tz-cell' + (isPunct ? ' punct' : '') + (isWrong ? ' wrong' : '');
    btn.setAttribute('aria-pressed', String(isWrong));
    btn.setAttribute('aria-label', isPunct ? `標點 ${ch}（撳一下標記漏寫）` : `字 ${ch}（撳一下標記寫錯）`);
    btn.textContent = ch;

    if (isWrong) {
      const badge = document.createElement('span');
      badge.className = 'tz-badge';
      badge.textContent = '要改';
      btn.append(badge);
    }

    btn.addEventListener('click', () => {
      const set = wrongChars.get(item.id) || new Set();
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      wrongChars.set(item.id, set);
      if (set.size > 0 && marks.get(item.id) !== 'retry') {
        marks.set(item.id, 'retry');
        updateMarks();
      }
      renderCharGrid(item);
      renderCorrectionCoach(item);
      updateNavButtons();
    });
    grid.append(btn);
  });
}

function updateNavButtons() {
  const item = items[index];
  if (!item) return;
  const isRevealed = revealed.has(item.id);
  const isLast = index === items.length - 1;
  $('previous').disabled = index === 0;
  if (isLast) {
    $('next').textContent = '完成練習 →';
    $('next').className = isRevealed ? 'primary' : 'secondary';
  } else if (isRevealed) {
    $('next').textContent = '下一題 →';
    $('next').className = 'primary';
  } else {
    $('next').textContent = '跳過呢題 →';
    $('next').className = 'secondary';
  }
}

function updateMarks() {
  const currentId = items[index]?.id;
  ['correct', 'retry'].forEach(mark => {
    const button = $(`mark-${mark}`);
    const active = marks.get(currentId) === mark;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderSentenceTools(item) {
  const box = $('sentence-tools');
  const clauseHost = $('clause-buttons');
  clauseHost.replaceChildren();
  if (item.kind !== 'sentence' || manual) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const clauses = item.clauses || [item.text];
  clauses.forEach((cl, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'clause-btn';
    b.disabled = !selectedVoice;
    b.textContent = `第 ${i + 1} 小節`;
    b.addEventListener('click', () => {
      speak(cl, {
        slow: false,
        speakPunct: $('speak-punct').checked,
        customLabel: `正在讀第 ${i + 1} / ${clauses.length} 小節…`
      });
    });
    clauseHost.append(b);
  });
}

function renderQuestion() {
  stopSpeech();
  const item = items[index];
  const isRevealed = revealed.has(item.id);
  const isHinted = hinted.has(item.id);

  $('question-label').textContent = `第 ${index + 1} / ${items.length} 題`;
  $('session-kind').textContent = item.kind === 'word' ? '讀默詞語' : '《講故事》第三段';
  $('progress-fill').style.width = `${((index + 1) / items.length) * 100}%`;
  const progress = document.querySelector('[role="progressbar"]');
  progress.setAttribute('aria-valuemax', items.length);
  progress.setAttribute('aria-valuenow', index + 1);

  $('hidden-answer').hidden = isRevealed;
  $('answer-panel').hidden = !isRevealed;
  $('answer-text').textContent = isRevealed ? item.text : '';
  $('answer-text').classList.toggle('sentence', item.kind === 'sentence');

  $('hint-box').hidden = !isHinted;
  $('hint-box').textContent = isHinted ? `💡 提示：${item.hint || ''}` : '';
  $('hint-btn').textContent = isHinted ? '🙈 收埋提示' : '💡 唔記得點寫？睇少少部首提示（唔開答案）';

  if (isRevealed) {
    renderCharGrid(item);
    $('writing-tip').textContent = `📌 寫字貼士：${item.tip || '留意每一筆同標點位置。'}`;
    renderCorrectionCoach(item);
  } else {
    $('char-grid').replaceChildren();
    $('correction-coach').hidden = true;
  }

  $('reveal').hidden = isRevealed;
  $('mark-controls').hidden = !isRevealed;
  $('question-instruction').textContent = manual ? '請大人讀，小朋友用紙筆默。' : '聽一聽，喺紙上寫低。';
  $('question-hint').textContent = manual ? '大人可以先按「睇答案」，唔好畀小朋友睇。' : '答案會收埋，寫好先按下面「睇答案核對」。';
  $('play').textContent = '▶ 讀呢題';
  $('play').disabled = manual || !selectedVoice;
  $('slow').disabled = manual || !selectedVoice;
  status(manual ? '大人朗讀模式：冇自動播放聲音。' : '準備好就按「讀呢題」（長句可揀分小節讀）。');
  $('reveal').textContent = manual ? '👀 大人睇答案／寫好對答案' : '👀 寫好喇，睇答案核對';

  renderSentenceTools(item);
  updateMarks();
  updateNavButtons();
}

function startSession(isManual = false, retryItems = null) {
  stopSpeech();
  manual = isManual;
  items = retryItems || itemsForMode(mode);
  index = 0;
  marks = new Map();
  revealed = new Set();
  hinted = new Set();
  wrongChars = new Map();
  correctedOnPaper = new Set();
  $('session-label').textContent = retryItems ? '再練一次（錯題重默）' : labels[mode];
  showPhase('practice');
  renderQuestion();
  $('practice-title').tabIndex = -1;
  $('practice-title').focus({ preventScroll: true });
}

function renderMissedFocus() {
  const box = $('missed-focus-box');
  const list = $('missed-focus-list');
  list.replaceChildren();
  const focusItems = items.filter(item => marks.get(item.id) === 'retry' || (wrongChars.get(item.id)?.size > 0));
  if (!focusItems.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  focusItems.forEach(item => {
    const li = document.createElement('li');
    const picked = wrongChars.get(item.id);
    const chars = [...item.text];
    const pickedText = picked && picked.size
      ? `（特別留意：${[...picked].sort((a, b) => a - b).map(i => `「${chars[i]}」`).join('、')}）`
      : '';
    li.textContent = `${item.text}${pickedText} — ${item.tip || ''}`;
    list.append(li);
  });
}

function updateSummaryCounts() {
  const counts = getCounts(items, marks);
  $('correct-count').textContent = counts.correct;
  $('retry-count').textContent = counts.retry;
  $('unmarked-count').textContent = counts.unmarked;
  const remaining = counts.retry + counts.unmarked;
  $('retry-missed').disabled = remaining === 0;
  $('retry-missed').textContent = remaining ? `再練未熟／未對嘅 ${remaining} 題 ↻` : '全部都自己對啱喇 ✓';
  $('summary-copy').textContent = remaining
    ? `今次練咗 ${items.length} 題。先望一望下面重點字貼士，再按「再練未熟／未對嘅 ${remaining} 題」重默一次！`
    : `今次 ${items.length} 題全部自己核對寫啱晒，做得好叻！`;
  renderMissedFocus();
}

function showSummary() {
  stopSpeech();
  showPhase('summary');
  updateSummaryCounts();
  $('answer-list').replaceChildren();
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'review-item';
    const label = document.createElement('small');
    label.textContent = `第 ${i + 1} 題 · ${item.kind === 'word' ? '詞語' : '段落句子'}`;
    const text = document.createElement('p');
    text.textContent = item.text;
    const tip = document.createElement('div');
    tip.className = 'review-tip';
    tip.textContent = `💡 ${item.tip || ''}`;
    const controls = document.createElement('div');
    controls.className = 'review-buttons';
    [['correct', '✓ 寫啱'], ['retry', '↻ 再練']].forEach(([value, caption]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = caption;
      b.classList.toggle('selected', marks.get(item.id) === value);
      b.setAttribute('aria-pressed', String(marks.get(item.id) === value));
      b.addEventListener('click', () => {
        marks.set(item.id, value);
        [...controls.children].forEach(other => {
          other.classList.toggle('selected', other === b);
          other.setAttribute('aria-pressed', String(other === b));
        });
        updateSummaryCounts();
      });
      controls.append(b);
    });
    li.append(label, text, tip, controls);
    $('answer-list').append(li);
  });
  $('summary-title').tabIndex = -1;
  $('summary-title').focus({ preventScroll: true });
}

function backToSetup() {
  stopSpeech();
  showPhase('setup');
  refreshVoices();
}

document.querySelectorAll('[data-mode]').forEach(button =>
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(other => {
      other.classList.toggle('selected', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
  })
);

$('voice-select').addEventListener('change', () => {
  stopSpeech();
  selectedVoice = voices.find(v => v.voiceURI === $('voice-select').value) || null;
});
$('test-voice').addEventListener('click', () => speak('準備好紙同筆，我哋一齊默書啦。', { slow: false, test: true }));
$('refresh-voices').addEventListener('click', refreshVoices);
$('start').addEventListener('click', () => { if (selectedVoice) startSession(false); });
$('manual-start').addEventListener('click', () => startSession(true));

$('play').addEventListener('click', () => {
  const item = items[index];
  speak(item.text, { slow: false, speakPunct: item.kind === 'sentence' && $('speak-punct').checked });
});
$('slow').addEventListener('click', () => {
  const item = items[index];
  speak(item.text, { slow: true, speakPunct: item.kind === 'sentence' && $('speak-punct').checked });
});
$('pause').addEventListener('click', () => {
  if (!playing || !synth) return;
  if (paused) {
    synth.resume();
    setSpeaking(true, false);
    status('繼續朗讀。如果冇聲，按「再讀一次」由頭讀。');
  } else {
    synth.pause();
    setSpeaking(true, true);
    status('暫停咗。按「繼續」接住讀，或者「再讀一次」由頭讀。');
  }
});

$('hint-btn').addEventListener('click', () => {
  const item = items[index];
  if (hinted.has(item.id)) hinted.delete(item.id);
  else hinted.add(item.id);
  const isHinted = hinted.has(item.id);
  $('hint-box').hidden = !isHinted;
  $('hint-box').textContent = isHinted ? `💡 提示：${item.hint || ''}` : '';
  $('hint-btn').textContent = isHinted ? '🙈 收埋提示' : '💡 唔記得點寫？睇少少部首提示（唔開答案）';
});

$('reveal').addEventListener('click', () => {
  stopSpeech();
  const item = items[index];
  revealed.add(item.id);
  $('hidden-answer').hidden = true;
  $('answer-panel').hidden = false;
  $('answer-text').textContent = item.text;
  $('reveal').hidden = true;
  $('mark-controls').hidden = false;
  renderCharGrid(item);
  $('writing-tip').textContent = `📌 寫字貼士：${item.tip || ''}`;
  renderCorrectionCoach(item);
  updateNavButtons();
  status(manual ? '請大人朗讀，或用紙本答案逐字核對。' : '逐格對一對紙上嘅字同標點，再揀「我寫啱喇」或「再練一次」。');
});

$('rehide').addEventListener('click', () => {
  stopSpeech();
  const item = items[index];
  revealed.delete(item.id);
  renderQuestion();
  status('已收埋答案！喺紙上再默寫一次，寫好再按「睇答案核對」。');
});

$('coach-done').addEventListener('click', () => {
  const item = items[index];
  correctedOnPaper.add(item.id);
  renderCorrectionCoach(item);
  status('改正得好認真！陣間完成後按「再練未熟嘅題目」重默多一次就記實晒！');
});

['correct', 'retry'].forEach(value =>
  $(`mark-${value}`).addEventListener('click', () => {
    const item = items[index];
    marks.set(item.id, value);
    if (value === 'correct') {
      wrongChars.delete(item.id);
      renderCharGrid(item);
    }
    updateMarks();
    renderCorrectionCoach(item);
    updateNavButtons();
    status(value === 'correct' ? '好嘢！準備好就按「下一題 →」。' : '先喺紙上改正 3 次，完成後可以重默呢題！');
  })
);

$('previous').addEventListener('click', () => {
  if (index > 0) {
    index--;
    renderQuestion();
  }
});
$('next').addEventListener('click', () => {
  if (index < items.length - 1) {
    index++;
    renderQuestion();
  } else {
    showSummary();
  }
});
$('retry-missed').addEventListener('click', () => {
  const remaining = items.filter(item => marks.get(item.id) !== 'correct');
  if (remaining.length) startSession(manual, remaining);
});
$('restart').addEventListener('click', backToSetup);
$('leave').addEventListener('click', () => {
  stopSpeech();
  $('exit-dialog').showModal();
});
$('cancel-exit').addEventListener('click', () => $('exit-dialog').close());
$('confirm-exit').addEventListener('click', () => {
  $('exit-dialog').close();
  backToSetup();
});
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  if (phase === 'practice') {
    stopSpeech();
    $('exit-dialog').showModal();
  } else {
    backToSetup();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopSpeech();
    if (phase === 'practice') status('離開頁面時已停止朗讀。返嚟可以按「再讀一次」。');
  }
});
window.addEventListener('pagehide', stopSpeech);
if (synth) synth.addEventListener('voiceschanged', refreshVoices);
refreshVoices();
setTimeout(refreshVoices, 600);
setTimeout(refreshVoices, 2000);
