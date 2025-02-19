// server.js
import http from "http"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import WebSocket from "ws"
import { ModuleGraph } from "./moduleGraph.js"
import { resolveModule } from "./resolveModule.js"
import { transformModuleCode } from "./hmr-transform.js"
import FileWatcher from "./fileWatcher.js"

// 计算 __dirname（在 ES module 中没有内置 __dirname）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 统一使用同一个模块图实例
const moduleGraph = new ModuleGraph()

// 启动 WebSocket 服务，监听 5173 端口（用于向客户端传递 HMR 消息）
const wss = new WebSocket.Server({ port: 5173 })
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}
wss.on("connection", (ws) => {
  console.log("HMR Client connected.")
})

// 简单获取 MIME 类型
function getMimeType(filePath) {
  const ext = path.extname(filePath)
  switch (ext) {
    case ".html":
      return "text/html"
    case ".js":
      return "application/javascript"
    case ".css":
      return "text/css"
    default:
      return "text/plain"
  }
}

// 辅助函数：将绝对文件路径转换为公开 URL 路径（相对于项目根目录）
function getPublicPath(filePath) {
  return "/" + path.relative(process.cwd(), filePath).replace(/\\/g, "/")
}

// HTTP 开发服务器
const server = http.createServer(async (req, res) => {
  // 假设 req.url 不包含查询参数
  const urlWithoutQuery = req.url.split("?")[0]
  const filePath = path.resolve(__dirname, "." + urlWithoutQuery)

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404
    res.end("Not Found")
    return
  }

  // 如果请求的文件名中包含 "main"，则将其视为入口文件，
  // 这里传递绝对路径给 resolveModule()（用于文件读取和依赖解析）
  if (urlWithoutQuery.includes("main")) {
    console.log(`Treating ${filePath} as an entry file.`)
    resolveModule(moduleGraph, filePath)
    const moduleTree = moduleGraph.getModuleTree(filePath)
    console.log("Module Tree:", JSON.stringify(moduleTree, null, 2))
  }

  let content = fs.readFileSync(filePath, "utf-8")
  const mimeType = getMimeType(filePath)
  if (mimeType === "application/javascript") {
    content = transformModuleCode(filePath, content)
  }
  res.setHeader("Content-Type", mimeType)
  res.end(content)
})

server.listen(3000, () => {
  console.log("HTTP Server is running at http://localhost:3000")
})

/**
 * 当文件变化时，更新模块图，并发送 HMR 更新消息给客户端
 */
function onFileChange(changedFile, eventType) {
  console.log(`File ${changedFile} ${eventType}`)
  // 这里传绝对路径给 resolveModule 以便正确读取文件
  resolveModule(moduleGraph, changedFile)

  // 构造更新消息时，使用公开路径（例如 "/vite/utils.js"）
  const publicPath = getPublicPath(changedFile)
  const updatePayload = {
    type: "update",
    updates: [
      {
        type: "js-update",
        path: getPublicPath(moduleGraph.getDependents(changedFile)[0]),
        acceptedPath: publicPath,
        timestamp: Date.now(),
      },
    ],
  }
  broadcast(updatePayload)
}

// 启动文件监听器，监听项目中 "vite" 目录（根据项目结构调整）
const watcher = new FileWatcher({
  path: path.resolve(__dirname, "vite"),
  onChange: onFileChange,
})
watcher.start()
