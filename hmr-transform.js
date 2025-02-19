import path from "path"

/**
 * 对模块代码进行转换，注入 HMR 上下文变量（仿照 Vite 自动注入的方式）
 * 该转换会在模块顶部注入如下代码：
 *
 * import { createHotContext as __vite__createHotContext } from "./@vite/hmrClient.js";
 * import.meta.hot = __vite__createHotContext("<modulePath>");
 *
 * 如果文件在 @vite 目录下，跳过注入。
 * @param {string} filePath - 模块的绝对路径
 * @param {string} code - 模块原始代码
 * @returns {string} 转换后的代码
 */
export function transformModuleCode(filePath, code) {
  // 如果文件路径包含 @vite 目录，则跳过注入
  if (filePath.includes("@vite")) {
    return code
  }

  // 这里只处理 .js、.jsx、.ts、.tsx 文件
  if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return code
  }

  // 归一化文件路径（将 Windows 反斜杠转换为正斜杠）
  const normalizedFilePath = filePath.replace(/\\/g, "/")

  // 构造注入代码，模仿 Vite 的写法
  const publicModulePath = "/" + path.relative(process.cwd(), filePath).replace(/\\/g, "/")
  const injection =
    `import { createHotContext as __vite__createHotContext } from "./@vite/hmrClient.js";\n` +
    `import.meta.hot = __vite__createHotContext("${publicModulePath}");\n`

  // 将注入代码拼接到原始代码之前
  return injection + code
}
