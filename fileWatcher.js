// fileWatcher.js
import chokidar from "chokidar"

class FileWatcher {
  constructor(options) {
    this.path = options.path // 监听的路径
    this.ignored = options.ignored || /(^|[\/\\])\../ // 忽略隐藏文件
    this.onChange = options.onChange || (() => {}) // 文件变化时的回调
    this.watcher = null // 监听器实例
  }

  // 启动监听
  start() {
    this.watcher = chokidar.watch(this.path, {
      ignored: this.ignored, // 忽略的文件或目录
      persistent: true, // 持续监听
      ignoreInitial: true, // 忽略初始化事件
    })

    console.log(`开始监听路径: ${this.path}`)

    // 监听文件变化
    this.watcher
      .on("add", (path) => this.onChange(path, "add")) // 文件添加
      .on("change", (path) => this.onChange(path, "change")) // 文件修改
      .on("unlink", (path) => this.onChange(path, "unlink")) // 文件删除
  }

  // 停止监听
  stop() {
    if (this.watcher) {
      this.watcher.close()
      console.log("已停止监听")
    }
  }
}

// 导出模块
export default FileWatcher
