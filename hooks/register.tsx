import type { Register } from 'claude-code'

import type { DotSnap } from '../types'

// 自分用とグループ用のドットの画面の口（このPCの中だけで開いている）。読むだけ
const DOTS = [
  { name: '自分用', port: 8790 },
  { name: 'グループ用', port: 8792 },
]
const PANE = 'dots'
const EVERY_MS = 15000

const SNAPS = { plugin: 'homedot-panel', key: 'snaps' } as const
const SEEN = { plugin: 'homedot-panel', key: 'seen' } as const

type Task = { id: number; title: string; status: string }
type Approval = { id: number; summary: string; status: string }
type Activity = { task_id: number; text: string }
type State = { status: string; tasks: Task[]; approvals: Approval[]; activity: Activity[] }
type Fetch = (port: number) => Promise<string | null>

// $ は渡さない（$ の呼び出しは各フックの中に直接書く。そうしないとエンジンがその機能を渡さない）
async function look(fetch: Fetch, dot: { name: string; port: number }): Promise<DotSnap> {
  const empty: DotSnap = {
    name: dot.name, up: false, status: [], running: [], pending: 0, approvals: [], recent: [], checkedAt: Date.now(),
  }
  try {
    const out = await fetch(dot.port)
    if (!out) return empty
    const s = JSON.parse(out) as State
    return {
      name: dot.name,
      up: true,
      status: String(s.status || '').split('\n').filter(Boolean),
      running: s.tasks.filter(t => t.status === 'running').map(t => `#${t.id} ${t.title}`),
      pending: s.tasks.filter(t => t.status === 'pending').length,
      approvals: s.approvals.filter(a => a.status === 'pending').map(a => ({ id: a.id, summary: a.summary })),
      recent: s.activity.slice(0, 4).map(a => `#${a.task_id} ${a.text}`.replace(/\s+/g, ' ')),
      checkedAt: Date.now(),
    }
  } catch {
    return empty
  }
}

const seenId = (d: string, id: number) => id * 10 + (d === '自分用' ? 1 : 2)

type Limit = { kind: string; percentUsed: number; resetsAt?: string }

// この Claude Code の5時間枠（最後の返事が教えてくれた値。まだ無ければ出さない）
function fiveHour(limits: Limit[]) {
  const w = limits.find(l => l.kind === 'five_hour')
  if (!w) return ''
  const at = w.resetsAt ? new Date(w.resetsAt).getTime() : NaN
  const left = isNaN(at) ? '' : ` あと${Math.max(0, Math.ceil((at - Date.now()) / 60000))}分`
  return ` 5h ${Math.round(w.percentUsed)}%${left}`
}

function summary(list: DotSnap[]) {
  return list
    .map(d => {
      const name = d.name === '自分用' ? '自分' : 'グループ'
      if (!d.up) return `${name}🔴`
      const quota = d.status.find(l => l.startsWith('5時間枠'))
      const q = quota ? ' ' + (quota.match(/(\d+)%\s*使用/)?.[1] ?? '?') + '%' : ''
      const ask = d.approvals.length ? ` 許可${d.approvals.length}` : ''
      const run = d.running.length ? ` 実行${d.running.length}` : ''
      return `${name}${d.status[0]?.includes('休み') ? '🟡' : '🟢'}${run}${ask}${q}`
    })
    .join(' ')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'dots', description: 'ドット（自分用・グループ用）の状態をパネルで見る' })

    const tick = async () => {
      const fetch: Fetch = async port => {
        const r = await $.process.run(
          ['C:\\Windows\\System32\\curl.exe', '-s', '--max-time', '8', `http://127.0.0.1:${port}/api/state`],
          { timeoutMs: 12000 },
        )
        return r.exitCode === 0 && r.stdout ? r.stdout : null
      }
      const list: DotSnap[] = []
      for (const dot of DOTS) list.push(await look(fetch, dot))
      await $.state.set(SNAPS, list)

      // 許可待ちが新しく出たら知らせる（同じものは1回だけ）
      const { value: known = [] } = await $.state.get(SEEN)
      const fresh = list.flatMap(d => d.approvals.map(a => ({ d: d.name, ...a }))).filter(a => !known.includes(seenId(a.d, a.id)))
      for (const a of fresh) $.ui.toast(`ドット（${a.d}）が許可を待っている：#${a.id} ${a.summary.split('\n')[0].slice(0, 60)}`)
      if (fresh.length) await $.state.set(SEEN, [...known, ...fresh.map(a => seenId(a.d, a.id))].slice(-200))

      const { rateLimits } = await $.session.usage()
      $.ui.status(`${summary(list)}${fiveHour(rateLimits)}`)
    }

    void tick()
    $.clock.every(EVERY_MS, () => void tick())
    return next(e)
  })

  // 5時間枠が1ポイント動いたら、15秒を待たずに書き直す
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      const { value: list = [] } = await $.state.get(SNAPS)
      if (list.length) $.ui.status(`${summary(list)}${fiveHour(e.rateLimits)}`)
    }
    return next(e)
  })

  on('command.run', { command: 'dots' }, async $ => {
    await $.ui.open({ id: PANE, title: 'ドット' })
    return { text: 'ドットのパネルを開いた。15秒ごとに新しくなる。' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const { value: list = [] } = await $.state.get(SNAPS)
    if (list.length === 0) return <Text dimColor>読み込み中…</Text>

    return (
      <Box flexDirection="column" gap={1}>
        {list.map(d => (
          <Box flexDirection="column">
            <Text bold>{d.name}のドット</Text>
            {!d.up && <Text color="red">止まっている（画面の口 に届かない）</Text>}
            {d.up && d.status.map(line => <Text wrap="truncate-end">{line}</Text>)}
            {d.up && d.running.map(r => <Text color="cyan" wrap="truncate-end">実行中 {r}</Text>)}
            {d.up && d.pending > 0 && <Text dimColor>待ち {d.pending} 件</Text>}
            {d.up && d.approvals.map(a => (
              <Text color="yellow" wrap="truncate-end">許可待ち #{a.id} {a.summary.split('\n')[0]}</Text>
            ))}
            {d.up && d.recent.length > 0 && <Text dimColor>最近の活動</Text>}
            {d.up && d.recent.map(r => <Text dimColor wrap="truncate-end">{r}</Text>)}
          </Box>
        ))}
        <Text dimColor>15秒ごとに更新・{new Date(list[0].checkedAt).toLocaleTimeString('ja-JP')}</Text>
      </Box>
    )
  })
}
