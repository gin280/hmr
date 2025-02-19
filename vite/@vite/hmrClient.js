// hmrClient.js
import { onEvent, offEvent, emitEvent } from "./hmr-events.js"

// 下面这些 Map 用于存储每个模块（ownerPath）的 HMR 回调和数据
const ownerPathToAcceptCallbacks = new Map()
const ownerPathToDisposeCallbacks = new Map()
const ownerPathToPruneCallbacks = new Map()
const ownerPathToData = new Map()

// WebSocket 连接等代码保持不变
const ws = new WebSocket("ws://localhost:5173")

ws.addEventListener("message", ({ data }) => {
  const payload = JSON.parse(data)
  switch (payload.type) {
    case "full-reload":
      handleFullReload()
      break
    case "update":
      handleUpdate(payload.updates)
      break
    case "prune":
      handlePrune(payload.paths)
      break
    case "connected":
      console.log("Connected to Vite dev server")
      break
    case "error":
      handleError(payload.error)
      break
    case "custom":
      handleCustom(payload)
      break
    default:
      console.warn(`Unknown HMR payload type: ${payload.type}`)
  }
})

function handleFullReload() {
  console.log("Triggering full page reload...")
  window.location.reload()
}

export async function handleUpdate(updates) {
  for (const update of updates) {
    const { path, acceptedPath, timestamp } = update

    // 调用旧模块的 dispose 回调（如果存在）
    const disposeCb = ownerPathToDisposeCallbacks.get(path)
    if (disposeCb) {
      disposeCb(ownerPathToData.get(path))
    }

    const newModule = await import(`${acceptedPath}?t=${timestamp}`)
    console.log(acceptedPath, "acceptedPath")
    console.log(path, "path")
    console.log(JSON.stringify(newModule), "newModule")
    const acceptCbs = ownerPathToAcceptCallbacks.get(path) || []
    console.log("Accept callbacks for", path, acceptCbs)
    for (const cb of acceptCbs) {
      console.log(path, acceptedPath, cb)
      if (cb.deps.some((dep) => dep.includes(acceptedPath))) {
        cb.fn(newModule)
      }
    }
  }
}

function handlePrune(paths) {
  for (const p of paths) {
    const data = ownerPathToData.get(p)
    ownerPathToDisposeCallbacks.get(p)?.(data)
    ownerPathToPruneCallbacks.get(p)?.(data)
    ownerPathToData.delete(p)
    ownerPathToDisposeCallbacks.delete(p)
    ownerPathToPruneCallbacks.delete(p)
    ownerPathToAcceptCallbacks.delete(p)
  }
}

function handleError(error) {
  console.error("Error from Vite dev server:", error)
}

function handleCustom(payload) {
  console.log("Custom payload:", payload)
}

// 创建 HMR 上下文，并扩展 on/off 方法
export function createHotContext(ownerPath) {
  const callbacks = {
    accept: [],
    dispose: null,
    prune: null,
  }

  ownerPathToAcceptCallbacks.set(ownerPath, callbacks.accept)
  ownerPathToDisposeCallbacks.set(ownerPath, callbacks.dispose)
  ownerPathToPruneCallbacks.set(ownerPath, callbacks.prune)
  ownerPathToData.set(ownerPath, {})

  return {
    accept(deps, callback) {
      if (typeof deps === "function") {
        callbacks.accept.push({ deps: [ownerPath], fn: deps })
      } else if (Array.isArray(deps)) {
        callbacks.accept.push({ deps, fn: callback })
      } else if (typeof deps === "string") {
        callbacks.accept.push({ deps: [deps], fn: callback })
      }
      console.log(callbacks.accept, "callbacks.accept")
    },
    dispose(callback) {
      callbacks.dispose = callback
      ownerPathToDisposeCallbacks.set(ownerPath, callback)
    },
    prune(callback) {
      callbacks.prune = callback
      ownerPathToPruneCallbacks.set(ownerPath, callback)
    },
    invalidate() {
      // 先触发本地事件，再通知服务器模块失效
      emitEvent("vite:invalidate", { path: ownerPath })
      ws.send(
        JSON.stringify({
          type: "custom",
          event: "vite:invalidate",
          data: { path: ownerPath },
        })
      )
    },
    on(eventName, callback) {
      onEvent(eventName, callback)
    },
    off(eventName, callback) {
      offEvent(eventName, callback)
    },
    get data() {
      return ownerPathToData.get(ownerPath)
    },
  }
}
