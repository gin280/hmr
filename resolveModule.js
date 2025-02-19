import { analyzeModule } from "./importAnalysis"

// 递归分析模块
export function resolveModule(moduleGraph, filePath, visited = new Set()) {
  if (visited.has(filePath)) return
  visited.add(filePath)

  // 解析当前模块并构建 moduleGraph
  analyzeModule(filePath, moduleGraph)

  // 从 moduleGraph 获取当前模块节点，如果不存在则直接返回
  const moduleNode = moduleGraph.modules.get(filePath)
  if (!moduleNode) return

  // 递归处理所有依赖模块
  for (const dep of moduleNode.dependencies) {
    resolveModule(moduleGraph, dep, visited)
  }
}
