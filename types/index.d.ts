export type DotSnap = {
  name: string
  up: boolean
  status: string[]
  running: string[]
  pending: number
  approvals: { id: number; summary: string }[]
  recent: string[]
  checkedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'homedot-panel': { snaps: DotSnap[]; seen: number[] }
  }
}
