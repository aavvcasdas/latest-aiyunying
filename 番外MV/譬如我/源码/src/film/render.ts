import atlasData from '../data/cast-atlas.json'
import { lyrics, lineAt, DURATION } from '../data/film'

type Frame = { y: number; w: number; h: number; n: number; fps: number }
const atlas: Record<string, Frame> = atlasData
type Actor = [string, number, number, number]
type Shot = { t: number; bg: string; actors?: Actor[]; focus?: number; zoom?: number; light?: string; walk?: boolean }
const at = (i: number) => lyrics[i].start
const shots: Shot[] = [
  { t: 0, bg: 'alley', actors: [['whale-idle', .64, .86, .19]], focus: .6 },
  { t: at(1), bg: 'alley', actors: [['whale-sad', .59, .9, .37]], zoom: 1.38 },
  { t: at(2), bg: 'workshop', focus: .62, zoom: 1.13 },
  { t: at(3), bg: 'alley', actors: [['whale-walk', .32, .85, .21]], walk: true },
  { t: at(5), bg: 'spotlight', actors: [['whale-idle', .19, .88, .17]], focus: .65 },
  { t: at(7), bg: 'seedling', focus: .65 },
  { t: at(8), bg: 'seedling', zoom: 1.43, focus: .7 },
  { t: 28.1, bg: 'alley', actors: [['whale-walk', .41, .85, .2]], walk: true },
  { t: at(9), bg: 'workshop', zoom: 1.06, focus: .4 },
  { t: at(10), bg: 'workshop', actors: [['claude-read', .77, .83, .22], ['whale-nod', .6, .85, .2]], focus: .68 },
  { t: at(11), bg: 'workshop', actors: [['gemini-choose', .35, .87, .21], ['whale-point', .55, .86, .23]], zoom: 1.12 },
  { t: at(12), bg: 'workshop', actors: [['whale-sad', .65, .86, .28]], focus: .69, zoom: 1.3 },
  { t: at(13), bg: 'alley', actors: [['whale-walk', .44, .88, .23]], walk: true },
  { t: at(15), bg: 'workshop', actors: [['kimi-think', .67, .88, .24], ['whale-nod', .48, .88, .23]], focus: .5, zoom: 1.08 },
  { t: at(17), bg: 'spotlight', actors: [['gpt-float', .59, .76, .31], ['whale-idle', .18, .89, .17]] },
  { t: at(18), bg: 'spotlight', actors: [['gpt-float', .51, .79, .3], ['claude-nod', .72, .8, .25], ['gemini-sway', .32, .8, .25]], zoom: 1.06 },
  { t: at(19), bg: 'spotlight', actors: [['gpt-bow', .53, .78, .28], ['claude-read', .68, .79, .22], ['whale-sad', .14, .9, .19]], focus: .3 },
  { t: at(20), bg: 'alley', actors: [['whale-walk', .44, .88, .22]], walk: true },
  { t: at(21), bg: 'alley', actors: [['whale-nod', .63, .89, .34]], zoom: 1.3 },
  { t: at(22), bg: 'workshop', focus: .3, zoom: 1.22 },
  { t: at(23), bg: 'seedling', actors: [['whale-idle', .32, .88, .18]], focus: .35 },
  { t: at(25), bg: 'spotlight', actors: [['gpt-bow', .63, .79, .25], ['whale-walk', .24, .9, .19]], walk: true },
  { t: at(27), bg: 'seedling', focus: .57 },
  { t: at(28), bg: 'seedling', actors: [['whale-nod', .28, .86, .21]], zoom: 1.12 },
  { t: 99.1, bg: 'alley', actors: [['doubao-step', .64, .88, .21], ['whale-wave', .44, .88, .22]] },
  { t: 103.1, bg: 'alley', actors: [['qwen-sway', .71, .87, .2], ['doubao-step', .6, .89, .19], ['whale-nod', .43, .88, .21]], focus: .6, zoom: 1.08 },
  { t: 106.1, bg: 'seedling', actors: [['zai-nod', .23, .9, .17], ['doubao-bow', .39, .88, .16], ['qwen-sway', .51, .88, .17]], focus: .61 },
  { t: at(29), bg: 'spotlight', actors: [['gpt-bow', .5, .79, .27], ['claude-nod', .69, .78, .23]], focus: .52 },
  { t: at(31), bg: 'alley', actors: [['whale-walk', .46, .86, .22]], walk: true },
  { t: at(32), bg: 'rooftop', focus: .74 },
  { t: at(34), bg: 'workshop', focus: .74, zoom: 1.19 },
  { t: at(35), bg: 'seedling', actors: [['whale-bow', .29, .87, .22]], focus: .46 },
  { t: at(37), bg: 'rooftop', focus: .7, zoom: 1.2 },
  { t: at(39), bg: 'seedling', focus: .64, zoom: 1.19 },
  { t: at(40), bg: 'bloom', focus: .7 },
]

export type FilmAssets = { backgrounds: Record<string, HTMLImageElement>; actors: HTMLImageElement }
let assetPromise: Promise<FilmAssets> | undefined
const image = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const im = new Image()
  im.onload = () => resolve(im)
  im.onerror = () => reject(new Error(`Image unavailable: ${src}`))
  im.src = src
})

export function loadFilm() {
  if (!assetPromise) assetPromise = (async () => {
    const names = ['rooftop', 'workshop', 'spotlight', 'bloom', 'alley', 'seedling']
    const results = await Promise.all([...names.map(n => image(`/images/${n}.jpg`)), image('/cast/motion.webp')])
    await document.fonts.load('600 46px "Film Serif"')
    return { backgrounds: Object.fromEntries(names.map((n, i) => [n, results[i]])), actors: results[6] }
  })().catch(e => { assetPromise = undefined; throw e })
  return assetPromise
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3)
const W = 1280, H = 720

function scene(ctx: CanvasRenderingContext2D, assets: FilmAssets, shot: Shot, t: number, end: number, reduced: boolean) {
  const age = Math.max(0, t - shot.t)
  const p = clamp(age / Math.max(1, end - shot.t))
  const im = assets.backgrounds[shot.bg]
  const scale = Math.max(W/im.width, H/im.height) * (shot.zoom || 1) * (reduced ? 1 : 1.025 + p*.045)
  const iw = im.width*scale, ih = im.height*scale
  const x = (W-iw)*clamp((shot.focus ?? .5) + (reduced ? 0 : (p-.5)*.035))
  ctx.drawImage(im, x, (H-ih)*.48, iw, ih)
  for (const [key, u, v, size] of shot.actors ?? []) {
    const f = atlas[key]
    const n = reduced ? 0 : Math.floor(t*f.fps) % f.n
    const height = H*size, width = height*f.w/f.h
    const ax = W*(u + (shot.walk && key.includes('walk') ? p*.14 : 0))
    const bob = reduced ? 0 : Math.sin(t*(key.startsWith('gpt') ? 1.4 : 2.1))*1.5
    ctx.save()
    ctx.fillStyle = 'rgba(2,9,19,.35)'
    ctx.beginPath(); ctx.ellipse(ax, H*v-2, width*.32, height*.045, 0, 0, Math.PI*2); ctx.fill()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(assets.actors, n*f.w, f.y, f.w, f.h, ax-width/2, H*v-height+bob, width, height)
    ctx.restore()
  }
  if (!reduced) {
    const warm = ['workshop', 'bloom', 'seedling'].includes(shot.bg)
    ctx.save()
    for (let i = 0; i < 26; i++) {
      const dustX = ((i*193.73 + Math.sin(t*.13+i)*15 + t*(warm ? 2 : -1.5))%W+W)%W
      const dustY = ((i*53.19 - t*(2+i%3))%H+H)%H
      ctx.globalAlpha = .12 + .14 * (1+Math.sin(t*.7+i))/2
      ctx.fillStyle = warm ? '#ffdeb4' : '#b5f9f2'
      ctx.beginPath(); ctx.arc(dustX, dustY, i%4===0 ? 1.9 : 1.1, 0, Math.PI*2); ctx.fill()
    }
    ctx.restore()
  }
  const shade = ctx.createLinearGradient(0, H*.54, 0, H)
  shade.addColorStop(0, 'rgba(4,10,17,0)'); shade.addColorStop(1, 'rgba(3,9,17,.55)')
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H)
}

function captions(ctx: CanvasRenderingContext2D, t: number, mode: 'character' | 'word', reduced: boolean) {
  const index = lineAt(t)
  if (index < 0) return
  const line = lyrics[index]
  const intimate = line.text === '譬如我'
  const last = index === 40
  const font = intimate ? 75 : line.text.length > 12 ? 42 : 48
  ctx.save()
  ctx.font = `600 ${font}px "Film Serif", serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const step = font * 1.09, spacing = font*.16
  const width = step*line.text.length + spacing*(line.words.length-1)
  let x = (W-width)/2 + step/2, idx = 0
  const y = H*(intimate ? .77 : .85)
  const fade = clamp((line.end-t)/.12)
  for (const word of line.words) {
    const wordT = line.times[idx]
    for (const ch of word) {
      const syllableT = line.times[idx]
      const cue = mode === 'word' ? wordT : syllableT
      const age = t-cue
      const u = reduced ? 1 : ease((age+.045)/.28)
      if (age >= -.045) {
        // The glyphs occupy a perspective-projected plane, not a line-wide CSS bounce.
        const z = (1-u)*-170 + Math.sin(clamp(age/.33)*Math.PI)*9
        const perspective = 920/(920-z)
        const yaw = reduced ? 0 : (1-u)*-.59
        const py = y + (reduced ? 0 : (1-u)*25)
        const px = W/2+(x-W/2)*perspective
        ctx.save()
        ctx.globalAlpha = fade*clamp((age+.045)/.1)
        ctx.translate(px, py)
        ctx.transform(perspective*Math.cos(yaw), Math.sin(yaw)*.12, (1-u)*.04, perspective, 0, 0)
        ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 9
        ctx.fillStyle = '#10292f'; ctx.fillText(ch, 2.2, 4.2)
        ctx.shadowBlur = 0
        ctx.fillStyle = last ? '#796e49' : '#37575c'; ctx.fillText(ch, .9, 2)
        ctx.fillStyle = t-syllableT < .38 && t >= syllableT ? (last ? '#ffe1a1' : '#b2f6ed') : '#f6f6ed'
        ctx.fillText(ch, 0, 0)
        ctx.restore()
      }
      x += step; idx++
    }
    x += spacing
  }
  ctx.restore()
}

export function drawFilm(ctx: CanvasRenderingContext2D, assets: FilmAssets, t: number, showCaptions = true, mode: 'character' | 'word' = 'character', reduced = false) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  ctx.save(); ctx.setTransform(w/W, 0, 0, h/H, 0, 0)
  let k = 0
  for (let i = 1; i < shots.length; i++) if (t >= shots[i].t) k = i
  const shot = shots[k], end = shots[k+1]?.t ?? DURATION
  scene(ctx, assets, shot, t, end, reduced)
  const transition = (t-shot.t)/.25
  if (k > 0 && transition < 1 && !reduced) {
    ctx.save(); ctx.globalAlpha = 1-ease(transition)
    scene(ctx, assets, shots[k-1], shot.t-.001, shot.t, reduced); ctx.restore()
  }
  if (showCaptions) captions(ctx, t, mode, reduced)
  if (t > DURATION-.75) {
    ctx.fillStyle = `rgba(5,14,19,${clamp((t-DURATION+.75)/.75)*.9})`; ctx.fillRect(0, 0, W, H)
  }
  ctx.restore()
}