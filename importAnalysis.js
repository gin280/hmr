import fs from "fs"
import path from "path"

// 解析模块的依赖
function parseDependencies(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  // console.log(`Content of ${filePath}:`, content) // 打印文件内容
  const dependencies = []

  // 简单的正则表达式匹配 import 语句
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    dependencies.push(match[1])
  }

  // console.log(`Dependencies of ${filePath}:`, dependencies) // 打印依赖
  return dependencies
}

// 解析模块路径
function resolveModulePath(parentPath, dep) {
  if (dep.startsWith(".")) {
    // 相对路径
    const resolvedPath = path.resolve(path.dirname(parentPath), dep)
    // console.log(`Resolved path: ${resolvedPath}`) // 打印解析后的路径
    if (!fs.existsSync(resolvedPath)) {
      // console.error(`File not found: ${resolvedPath}`) // 如果文件不存在，打印错误
    }
    return resolvedPath
  } else {
    // 第三方模块（如 'vue'）
    return dep // 这里简化处理，实际 Vite 会使用依赖预构建
  }
}

// 分析模块并将其依赖关系添加到模块图中
function analyzeModule(filePath, moduleGraph) {
  const dependencies = parseDependencies(filePath)

  for (const dep of dependencies) {
    // 如果依赖不是相对路径，跳过处理（或根据需要处理第三方模块）
    if (!dep.startsWith(".")) {
      // console.log(`Skipping external dependency: ${dep}`)
      continue
    }
    const depPath = resolveModulePath(filePath, dep)
    // console.log(`Adding dependency: ${filePath} -> ${depPath}`)
    moduleGraph.addDependency(filePath, depPath)
  }
}

export { parseDependencies, analyzeModule, resolveModulePath }
