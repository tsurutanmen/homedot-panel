# homedot-panel

A Claude Code mod for [homedot](https://github.com/tsurutanmen/homedot). It puts your agents and your 5-hour limit in the status line:

```
自分🟢 グループ🟢 0% 5h 32% あと206分
```

- 🟢 running, 🟡 resting (a game is on, or you told it to rest), 🔴 not reachable
- `実行1` / `許可1` appear when a task is running or waiting for your approval, and a toast pops up for each new approval
- `0%` after the group agent is how much of its share of the 5-hour window it has used
- `5h 32% あと206分` is this account's 5-hour window and the minutes until it resets
- `/dots` opens a pane with each agent's status, running tasks, approvals and recent activity

It reads `http://127.0.0.1:8790/api/state` (personal) and `8792` (group) every 15 seconds with `curl.exe`, so it is Windows only as written. Change the `DOTS` list at the top of `hooks/register.tsx` for other ports.

## Install

```
/plugin marketplace add tsurutanmen/homedot-panel
/plugin install homedot-panel@homedot-panel
```

Tested with Claude Code 2.1.286. Messages are in Japanese.

## License

MIT

---

## 日本語

[homedot](https://github.com/tsurutanmen/homedot) の状態と5時間枠を、Claude Code の下の行に出す mod。🟢 動いている・🟡 休み・🔴 止まっている。`5h 32% あと206分` は5時間枠と、戻るまでの分。`/dots` で詳しいパネルが開く。
