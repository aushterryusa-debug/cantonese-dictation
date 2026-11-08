// Transcribed and visually checked against the user's supplied revision sheet.
export const WORDS = ['期待','受傷','掌聲','摔倒','充滿','微笑','不慌不忙','鼓起勇氣'];
export const SENTENCES = ['同學聽後一起拍手。','美思說：「志文把每句話都說得很清楚。」','子朗說：「他會做動作和表情，讓我覺得這個故事既生動，又有趣！」'];

export const ITEM_GUIDES = {
  w0: {
    hint: '2 個字 · 意思：好盼望一件事發生 · 第 1 字右邊係「月」，第 2 字左邊係雙人旁「彳」。',
    tip: '「期」左邊係「其」（入面兩橫），右邊係「月」；「待」左邊係雙人旁「彳」，唔好寫成單人旁「亻」。',
    traps: { '期': '左「其」右「月」', '待': '雙人旁「彳」＋寺' }
  },
  w1: {
    hint: '2 個字 · 意思：整親身體 · 第 1 字中間係禿寶蓋「冖」，第 2 字左邊係單人旁「亻」。',
    tip: '「受」中間係禿寶蓋「冖」（冇一點），下面係「又」；「傷」左邊係單人旁「亻」，右下係「勿」。',
    traps: { '受': '爫＋冖＋又（中間冇點）', '傷': '單人旁「亻」＋右下「勿」' }
  },
  w2: {
    hint: '2 個字 · 意思：拍手嘅聲音 · 第 1 字下面係「手」，第 2 字下面係「耳」。',
    tip: '「掌」上面係尚字頭，下面係「手」；「聲」右上係「殳」，下面係「耳」（用耳仔聽聲音）。',
    traps: { '掌': '下面係「手」', '聲': '声＋殳，下面係「耳」' }
  },
  w3: {
    hint: '2 個字 · 意思：跌低 · 第 1 字左邊係提手旁「扌」，第 2 字左邊係單人旁「亻」。',
    tip: '「摔」左邊係提手旁「扌」，右邊係「率」（中間係幺＋幺，兩邊各兩點）；「倒」係「亻」加「到」。',
    traps: { '摔': '提手旁「扌」＋率', '倒': '單人旁「亻」＋到' }
  },
  w4: {
    hint: '2 個字 · 意思：裝滿晒 · 第 1 字下面係「儿」，第 2 字左邊係三點水「氵」。',
    tip: '「充」上面係「亠＋厶」，下面係「儿」；「滿」左邊三點水「氵」包住成個右邊「艹＋兩」。',
    traps: { '充': '亠＋厶＋儿', '滿': '三點水「氵」＋艹＋兩' }
  },
  w5: {
    hint: '2 個字 · 意思：輕輕開心咁笑 · 第 1 字左邊係「彳」，第 2 字上面係竹字頭「⺮」。',
    tip: '「微」左邊係「彳」，中間係「山＋一＋几」，右邊係反文旁「攵」；「笑」係竹字頭「⺮」加「夭」（第一筆係撇）。',
    traps: { '微': '彳＋山一几＋攵', '笑': '竹字頭「⺮」＋夭（首筆係撇）' }
  },
  w6: {
    hint: '4 個字（不＿不＿）· 意思：好鎮定、唔緊張 · 第 2 同第 4 個字左邊都係豎心旁「忄」。',
    tip: '「慌」同「忙」都同心情有關，左邊都係豎心旁「忄」；注意「慌」右邊中間係「亡」（冇一點！）。',
    traps: { '慌': '豎心旁「忄」＋荒（亡冇點）', '忙': '豎心旁「忄」＋亡' }
  },
  w7: {
    hint: '4 個字 · 意思：提起膽量唔驚 · 第 1 字左邊有「豆」，第 3 字下面係「力」。',
    tip: '「鼓」右邊係「支」（十＋又，唔係反文旁攵！）；「勇」上面係「甬」，下面係「力」；「氣」入面係「米」。',
    traps: { '鼓': '十豆十＋右邊係「支」', '勇': '下面係「力」', '氣': '气＋入面係「米」' }
  },
  s0: {
    hint: '全句 8 個字＋句號「。」· 講同學聽完故事之後一齊做咩動作。',
    tip: '留意「聽」字左邊係「耳」、右邊有「十＋四＋一＋心」；句尾記得加句號「。」。',
    clauses: ['同學聽後', '一起拍手。'],
    traps: { '聽': '耳＋王＋十＋四＋一＋心', '拍': '提手旁「扌」＋白' }
  },
  s1: {
    hint: '對話句 · 美思讚志文講故事講成點 · 記得寫冒號「：」、開引號「「」、句號「。」同關引號「」」。',
    tip: '「說」係言字旁；「清楚」嘅「清」係三點水、「楚」上面兩個「木」下面係「疋」。記得句號「。」寫喺關引號「」」入面！',
    clauses: ['美思說：', '「志文把每句話', '都說得很清楚。」'],
    traps: { '說': '言字旁「言」＋兌', '清': '三點水「氵」＋青', '楚': '林＋下面係「疋」' }
  },
  s2: {
    hint: '對話句（分兩小句）· 子朗讚志文識做咩，令故事有咩感覺 · 留意冒號、引號、逗號「，」同感嘆號「！」。',
    tip: '最易寫錯係「既生動」嘅「既」（右邊係旡，唔好寫成「即」！）、「表情」嘅「情」（豎心旁忄），句尾係感嘆號「！」再加關引號「」」。',
    clauses: ['子朗說：', '「他會做動作和表情，', '讓我覺得這個故事既生動，', '又有趣！」'],
    traps: { '動': '重＋力', '情': '豎心旁「忄」＋青', '讓': '言字旁「言」＋襄', '覺': '上面學字頭＋下面「見」', '既': '唔好寫成「即」！', '趣': '走＋取' }
  }
};

export const ITEMS = [
  ...WORDS.map((text, i) => ({ id: `w${i}`, text, kind: 'word', ...ITEM_GUIDES[`w${i}`] })),
  ...SENTENCES.map((text, i) => ({ id: `s${i}`, text, kind: 'sentence', ...ITEM_GUIDES[`s${i}`] }))
];

export function itemsForMode(mode) {
  return ITEMS.filter(item => mode === 'all' || (mode === 'words' ? item.kind === 'word' : item.kind === 'sentence'));
}

export function isCantoneseVoice(voice) {
  const lang = String(voice?.lang || '').toLowerCase().replaceAll('_', '-');
  return /^yue(?:-|$)/.test(lang) || /^zh-hk(?:-|$)/.test(lang);
}

export function getCounts(items, marks) {
  return items.reduce((counts, item) => {
    counts[marks.get(item.id) === 'correct' ? 'correct' : marks.get(item.id) === 'retry' ? 'retry' : 'unmarked']++;
    return counts;
  }, { correct: 0, retry: 0, unmarked: 0 });
}

const PUNCT_SPOKEN = {
  '：': '，冒號，',
  '「': '，開引號，',
  '」': '，關引號。',
  '，': '，逗號，',
  '。': '，句號。',
  '！': '，感嘆號。',
  '？': '，問號。',
  '、': '，頓號，'
};

export function toSpokenText(text, speakPunctuation = false) {
  if (!speakPunctuation) return String(text || '');
  let out = '';
  for (const ch of String(text || '')) {
    out += PUNCT_SPOKEN[ch] || ch;
  }
  return out.replace(/，+/g, '，').replace(/^，/, '');
}

export function isPunctuationChar(ch) {
  return Boolean(PUNCT_SPOKEN[ch]);
}
