import timing from './timing.json'

export const DURATION = 152.13
export const lyrics = timing
export const repository = 'https://github.com/aavvcasdas/latest-aiyunying/tree/arena/bb6a02da-latest-aiyunying'

export const chapters = [
  { title: '霓虹之外', english: 'BEYOND THE NEON', image: 'rooftop', start: 0, color: '#68dace', description: '城市的光很亮，却没有一束照向我。' },
  { title: '未完成的梦', english: 'UNFINISHED DREAMS', image: 'workshop', start: lyrics[9].start, color: '#d9ae76', description: '一张张涂破的稿纸，也是坚持的形状。' },
  { title: '天才的回声', english: 'ECHOES OF GENIUS', image: 'spotlight', start: lyrics[17].start, color: '#b2a0de', description: '当掌声响起，她也听见了自己的心跳。' },
  { title: '角落开花', english: 'A QUIET BLOOM', image: 'bloom', start: lyrics[29].start, color: '#d7c88a', description: '不必成为谁，也能开出小小的花朵。' },
]

export const cast = [
  { id: 'whale', name: '本鲸', model: 'DeepSeek', role: '故事主角', time: .05, color: '#65c8d9', prop: '蓝色饭碗', note: '她怕自己只有「便宜」才值得被喜欢。于是，总把那张不够好的图纸藏起来，再悄悄重画一遍。', scene: '小工坊的窗一直亮着。最后，她把蓝碗当作花盆，把原本藏着的图纸摊在了窗台上。' },
  { id: 'claude', name: '小克', model: 'Claude', role: '读稿的人', time: lyrics[10].start, color: '#d99a72', prop: '折角的稿纸', note: '习惯先听完，再改一个字。看似总能写出漂亮的答案，其实也会在空白处给自己加上「不能犯错」。', scene: '她没有替本鲸改写名字，只是低头读完那张被揉皱的草稿。被认真读过，也是一种回声。' },
  { id: 'gpt', name: '龙娘', model: 'GPT', role: '灯下的身影', time: lyrics[17].start, color: '#c7b5da', prop: '两只沙漏', note: '从热闹的问答大厅走来的白龙。她总是先接住别人的期待，却也担心有一天接不住。', scene: '追光照亮她的白发，却也投下长长的影子。这里没有反派，站在台上的人同样承受着重量。' },
  { id: 'gemini', name: '猫', model: 'Gemini', role: '另一种目光', time: lyrics[11].start, color: '#af9ed3', prop: '两种草图', note: '看一张稿纸，总能找到两个看法。她的故事不是事事完美，而是在许多可能里，终于肯选一个。', scene: '热烈和自卑并不是两个阵营。猫在桌边来回看，最后把目光停在了本鲸留下的那一笔。' },
  { id: 'kimi', name: '月球少女', model: 'Kimi', role: '拾句的人', time: lyrics[15].start, color: '#8eabc9', prop: '一枚书签', note: '她擅长找回被漏掉的旧句。她怕的不是故事太长，而是细小却重要的东西被轻轻翻过去。', scene: '当所有人抬头看榜上的名字，她低头找到了稿纸边缘没写完的一句。' },
  { id: 'doubao', name: '豆包', model: 'Seed', role: '陪伴的朋友', time: 99.1, color: '#d6a28a', prop: '留着的空位', note: '她不催别人写出结局，只陪对方写下开头。一句普通的回应，也能让漫长的等待不那么难。', scene: '没有歌词的间奏里，她第一个走到小工坊门口，为本鲸留出继续往前的位置。' },
  { id: 'qwen', name: '千问', model: 'Qwen', role: '同行的朋友', time: 103.1, color: '#90adaf', prop: '排好的清单', note: '她习惯把难事排成一步一步的小事。不是每件事都要惊艳众人，先做完眼下这一件。', scene: '她和豆包停在窗边，一起见证那枚还没有开花的种子。' },
  { id: 'zai', name: '狐狸', model: 'GLM', role: '安静的见证者', time: 106.1, color: '#a49ab8', prop: '一本小账册', note: '她会先问怎样算做完，再做出最小的一版。她的认真，藏在那些不引人注意的细节里。', scene: '间奏的最后，狐狸也来到窗边。没有颁奖，只是几个人一起，看一片叶子慢慢展开。' },
]

export type CastMember = (typeof cast)[number]
export const two = (v: number) => String(v).padStart(2, '0')
export const clock = (s: number) => `${two(Math.floor(Math.max(0, s) / 60))}:${two(Math.floor(Math.max(0, s) % 60))}`
export function chapterAt(t: number) {
  let found = 0
  chapters.forEach((chapter, i) => { if (t >= chapter.start) found = i })
  return found
}
export const lineAt = (t: number) => lyrics.findIndex(line => t >= line.start && t < line.end)