import esbuild from "esbuild"
import path from "path"
import fs from "fs"

// 预构建第三方模块
async function preBundleDependencies(deps) {
  const cacheDir = path.resolve("node_modules/.vite")
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  for (const dep of deps) {
    const entryPoint = require.resolve(dep)
    const outputFile = path.join(cacheDir, `${dep}.js`)

    await esbuild.build({
      entryPoints: [entryPoint],
      outfile: outputFile,
      format: "esm", // 转换为 ESM 格式
      bundle: true, // 打包为单个文件
    })

    console.log(`Pre-bundled ${dep} to ${outputFile}`)
  }
}

// 扫描项目中的第三方模块
function scanDependencies() {
  const deps = new Set()
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g

  // 递归遍历目录
  function traverseDir(dir) {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)

      // 判断是否为目录
      if (fs.statSync(fullPath).isDirectory()) {
        // 如果是目录，递归处理
        traverseDir(fullPath)
      } else if (fs.statSync(fullPath).isFile()) {
        // 如果是文件，处理文件内容
        const content = fs.readFileSync(fullPath, "utf-8")
        let match
        while ((match = importRegex.exec(content)) !== null) {
          const dep = match[1]
          if (!dep.startsWith(".")) {
            deps.add(dep) // 只添加第三方依赖
          }
        }
      }
    }
  }

  // 从 "vite" 目录开始扫描
  traverseDir("vite")

  return Array.from(deps)
}

// 示例：预构建第三方模块
const deps = scanDependencies()
preBundleDependencies(deps)
