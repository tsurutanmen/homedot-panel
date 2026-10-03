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

Tested with Claude Code 2.1.286 to 2.1.288. Messages are in Japanese.

## What it does on your PC

- **Runs** `C:\Windows\System32\curl.exe` every 15 seconds against `http://127.0.0.1:8790/api/state` and `http://127.0.0.1:8792/api/state`. Nothing leaves the PC.
- **Reads** this session's usage figures from Claude Code itself (`$.session.usage()`).
- **Writes nothing** to disk. It keeps what it shows in the session's own plugin state.
- **Opens no port** and submits no prompts.

## Related

Five tools that work together, all MIT:

| | |
|---|---|
| [homedot](https://github.com/tsurutanmen/homedot) | A Dots-style personal agent on Claude Code, in a WSL2 VM on your own PC |
| [session-bridge](https://github.com/tsurutanmen/session-bridge) | Let open Claude Code sessions talk to each other, hold meetings, and answer your voice |
| [claude-desk](https://github.com/tsurutanmen/claude-desk) | "Hey Claude" voice listener with VOICEVOX replies, and a desktop wallpaper of your sessions |
| [homedot-panel](https://github.com/tsurutanmen/homedot-panel) | homedot and the 5-hour limit in Claude Code's status line |
| [session-dash](https://github.com/tsurutanmen/session-dash) | Usage limits above the prompt, and every open session in one pane |

More Claude Code plugins: [tsurutanmen/claude-plugins](https://github.com/tsurutanmen/claude-plugins)

## License

MIT

---

## 日本語

[homedot](https://github.com/tsurutanmen/homedot) の状態と5時間枠を、Claude Code の下の行に出す mod。🟢 動いている・🟡 休み・🔴 止まっている。`5h 32% あと206分` は5時間枠と、戻るまでの分。`/dots` で詳しいパネルが開く。
