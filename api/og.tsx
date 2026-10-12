// Social-share image: next 2 weeks of custody nights, rendered from the live
// calendar on every fetch. iMessage builds link previews at send time, so the
// weekly text always carries the current schedule — no regeneration job needed.
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const SUPABASE_URL = 'https://lamkfkstsfuyrnffitht.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbWtma3N0c2Z1eXJuZmZpdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDMwMjIsImV4cCI6MjA5ODA3OTAyMn0.-AhMxeMiTdT1QWwNcNssDKDQ3EiKJfhYoqEkyAiak20'

const MOM_FG = '#d4aaff'
const DAD_FG = '#7fd6e8'

export default async function handler() {
  const chicago = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
  const today = new Date(chicago.getFullYear(), chicago.getMonth(), chicago.getDate())
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const end = new Date(today.getTime() + 13 * 24 * 3600_000)

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/family_custody?select=date,custody&date=gte.${iso(today)}&date=lte.${iso(end)}`,
    { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } },
  )
  const rows: { date: string; custody: string }[] = resp.ok ? await resp.json() : []
  const custody: Record<string, string> = {}
  for (const r of rows) custody[r.date] = r.custody

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getTime() + i * 24 * 3600_000)
    return {
      wd: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      mon: d.toLocaleDateString('en-US', { month: 'short' }),
      who: custody[iso(d)] ?? null,
    }
  })
  const range = `${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} \u2013 ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
  const updated = `${chicago.getMonth() + 1}/${chicago.getDate()}/${String(chicago.getFullYear()).slice(2)}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '1200px', height: '630px', background: '#11141b', padding: '32px 40px 22px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#ffffff' }}>Longo Family Calendar</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#9aa3b2' }}>{range}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {days.map((d, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 148, height: 168, borderRadius: 18, margin: 5,
              background: d.who === 'mom' ? 'rgba(180,140,220,0.28)' : d.who === 'dad' ? 'rgba(100,200,220,0.22)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${d.who === 'mom' ? 'rgba(180,140,220,0.5)' : d.who === 'dad' ? 'rgba(100,200,220,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              <div style={{ display: 'flex', fontSize: 21, color: '#9aa3b2', textTransform: 'uppercase', letterSpacing: 2 }}>{d.wd}</div>
              <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>{String(d.num)}</div>
              <div style={{ display: 'flex', fontSize: 17, color: '#6b7484', marginBottom: 6 }}>{d.mon}</div>
              <div style={{
                display: 'flex', fontSize: 21, fontWeight: 700, letterSpacing: 2, padding: '2px 14px', borderRadius: 999,
                color: d.who === 'mom' ? MOM_FG : d.who === 'dad' ? DAD_FG : '#3a4150',
                background: d.who === 'mom' ? 'rgba(180,140,220,0.25)' : d.who === 'dad' ? 'rgba(100,200,220,0.2)' : 'transparent',
              }}>{d.who === 'mom' ? 'MOM' : d.who === 'dad' ? 'DAD' : '\u2014'}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
          <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 10, background: MOM_FG, marginRight: 10 }} />
          <div style={{ display: 'flex', fontSize: 24, color: '#c7cdd8', marginRight: 36 }}>Mom nights</div>
          <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 10, background: DAD_FG, marginRight: 10 }} />
          <div style={{ display: 'flex', fontSize: 24, color: '#c7cdd8', marginRight: 36 }}>Dad nights</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#6b7484' }}>{`Updated ${updated} \u00b7 family.ryanlongo.com`}</div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630,
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  )
}
