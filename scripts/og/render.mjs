// Renders og.png — the next 2 weeks of custody nights as a 1200x630 social
// card — from the live family_custody table. Run locally or by the Thursday
// GitHub Action; the committed PNG is served statically by Vercel as the
// site's og:image, so iMessage link previews show the schedule itself.
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const fontDir = require.resolve('@fontsource/inter/package.json').replace(/package\.json$/, 'files/')
const inter400 = readFileSync(fontDir + 'inter-latin-400-normal.woff')
const inter700 = readFileSync(fontDir + 'inter-latin-700-normal.woff')

const SUPABASE_URL = 'https://lamkfkstsfuyrnffitht.supabase.co'
const ANON = process.env.FAMILY_ANON_KEY || readAnonFromSite()
function readAnonFromSite() {
  try {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
    return html.match(/eyJ[A-Za-z0-9_.-]{100,}/)?.[0] ?? ''
  } catch { return '' }
}

const MOM_FG = '#d4aaff'
const DAD_FG = '#7fd6e8'
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } })

const chicago = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
const today = new Date(chicago.getFullYear(), chicago.getMonth(), chicago.getDate())
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const end = new Date(today.getTime() + 13 * 24 * 3600_000)

const hdrs = { apikey: ANON, authorization: `Bearer ${ANON}` }
const resp = await fetch(
  `${SUPABASE_URL}/rest/v1/family_custody?select=date,custody&date=gte.${iso(today)}&date=lte.${iso(end)}`,
  { headers: hdrs },
)
if (!resp.ok) throw new Error(`custody fetch failed: ${resp.status}`)
const custody = Object.fromEntries((await resp.json()).map((r) => [r.date, r.custody]))

const nurseResp = await fetch(
  `${SUPABASE_URL}/rest/v1/family_nurse_days?select=date&date=gte.${iso(today)}&date=lte.${iso(end)}`,
  { headers: hdrs },
)
const nurseDays = new Set(nurseResp.ok ? (await nurseResp.json()).map((r) => r.date) : [])

// Small corner badge for Maranda's work days — subtle but visible.
const nurseIcon = `data:image/png;base64,${readFileSync(new URL('../../nurse-day.png', import.meta.url)).toString('base64')}`

const days = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(today.getTime() + i * 24 * 3600_000)
  return {
    wd: d.toLocaleDateString('en-US', { weekday: 'short' }),
    num: d.getDate(),
    mon: d.toLocaleDateString('en-US', { month: 'short' }),
    who: custody[iso(d)] ?? null,
    nurse: nurseDays.has(iso(d)),
  }
})
const range = `${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
const updated = `${chicago.getMonth() + 1}/${chicago.getDate()}/${String(chicago.getFullYear()).slice(2)}`

const tile = (d, i) =>
  h('div', {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    width: 148, height: 192, borderRadius: 18, margin: 5,
    background: d.who === 'mom' ? 'rgba(180,140,220,0.28)' : d.who === 'dad' ? 'rgba(100,200,220,0.22)' : 'rgba(255,255,255,0.05)',
    border: `2px solid ${d.who === 'mom' ? 'rgba(180,140,220,0.5)' : d.who === 'dad' ? 'rgba(100,200,220,0.5)' : 'rgba(255,255,255,0.08)'}`,
  },
    h('div', { display: 'flex', fontSize: 24, color: '#9aa3b2', textTransform: 'uppercase', letterSpacing: 2 }, d.wd),
    h('div', { display: 'flex', fontSize: 60, fontWeight: 700, color: '#ffffff', lineHeight: 1.12 }, String(d.num)),
    h('div', { display: 'flex', fontSize: 19, color: '#6b7484', marginBottom: 8 }, d.mon),
    h('div', {
      display: 'flex', fontSize: 23, fontWeight: 700, letterSpacing: 2, padding: '3px 16px', borderRadius: 999,
      color: d.who === 'mom' ? MOM_FG : d.who === 'dad' ? DAD_FG : '#3a4150',
      background: d.who === 'mom' ? 'rgba(180,140,220,0.25)' : d.who === 'dad' ? 'rgba(100,200,220,0.2)' : 'transparent',
    }, d.who === 'mom' ? 'MOM' : d.who === 'dad' ? 'DAD' : '—'),
    d.nurse ? { type: 'img', props: { src: nurseIcon, width: 30, height: 30, style: { position: 'absolute', top: 9, right: 9, borderRadius: 8, opacity: 0.88 } } } : null,
  )

const legendDot = (color) => h('div', { display: 'flex', width: 20, height: 20, borderRadius: 10, background: color, marginRight: 10 })

const svg = await satori(
  h('div', {
    display: 'flex', flexDirection: 'column', width: '1200px', height: '630px',
    background: '#11141b', padding: '34px 40px 24px', fontFamily: 'Inter', justifyContent: 'space-between',
  },
    h('div', { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
      h('div', { display: 'flex', fontSize: 40, fontWeight: 700, color: '#ffffff' }, 'Longo Family Calendar'),
      h('div', { display: 'flex', fontSize: 28, color: '#9aa3b2' }, range),
    ),
    h('div', { display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }, ...days.map(tile)),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
      legendDot(MOM_FG),
      h('div', { display: 'flex', fontSize: 24, color: '#c7cdd8', marginRight: 30 }, 'Mom nights'),
      legendDot(DAD_FG),
      h('div', { display: 'flex', fontSize: 24, color: '#c7cdd8', marginRight: 30 }, 'Dad nights'),
      { type: 'img', props: { src: nurseIcon, width: 22, height: 22, style: { borderRadius: 6, marginRight: 9, opacity: 0.9 } } },
      h('div', { display: 'flex', fontSize: 24, color: '#c7cdd8', marginRight: 30 }, 'Nurse day'),
      h('div', { display: 'flex', fontSize: 22, color: '#6b7484' }, `Updated ${updated} · family.ryanlongo.com`),
    ),
  ),
  {
    width: 1200, height: 630,
    fonts: [
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
    ],
  },
)

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
writeFileSync(new URL('../../og.png', import.meta.url), png)
console.log(`og.png written (${png.length} bytes) — ${days.filter((d) => d.who === 'mom').length} mom nights / ${days.filter((d) => d.who === 'dad').length} dad nights, updated ${updated}`)
