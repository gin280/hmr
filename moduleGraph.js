class ModuleNode {
  constructor(id) {
    this.id = id // 模块的唯一标识（如文件路径或模块 ID）
    this.dependencies = new Set() // 直接依赖的模块
    this.dependents = new Set() // 依赖该模块的模块
    this.metadata = {} // 模块的元数据（如导出内容、编译结果等）
  }
}

class ModuleGraph {
  constructor() {
    this.modules = new Map() // 存储所有模块
  }

  // 添加模块
  addModule(id) {
    if (!this.modules.has(id)) {
      this.modules.set(id, new ModuleNode(id))
    }
    return this.modules.get(id)
  }

  // 删除模块
  deleteModule(id) {
    const module = this.modules.get(id)
    if (module) {
      // 从依赖模块中移除该模块
      for (const dep of module.dependencies) {
        const depNode = this.modules.get(dep)
        if (depNode) {
          depNode.dependents.delete(id)
        }
      }
      // 从依赖该模块的模块中移除该模块
      for (const dep of module.dependents) {
        const depNode = this.modules.get(dep)
        if (depNode) {
          depNode.dependencies.delete(id)
        }
      }
      // 删除模块
      this.modules.delete(id)
    }
  }

  // 添加依赖关系
  addDependency(from, to) {
    const fromNode = this.addModule(from)
    const toNode = this.addModule(to)
    fromNode.dependencies.add(to)
    toNode.dependents.add(from)
  }

  // 获取模块的直接依赖
  getDependencies(id) {
    const module = this.modules.get(id)
    return module ? Array.from(module.dependencies) : []
  }

  // 获取模块的所有依赖（递归）
  getAllDependencies(id, seen = new Set()) {
    const module = this.modules.get(id)
    if (!module || seen.has(id)) return []
    seen.add(id)
    let deps = []
    for (const dep of module.dependencies) {
      deps.push(dep)
      deps.push(...this.getAllDependencies(dep, seen))
    }
    return deps
  }

  // 获取依赖该模块的所有模块（用于 HMR 更新传播）
  getDependents(id) {
    const module = this.modules.get(id)
    return module ? Array.from(module.dependents) : []
  }

  // 获取模块的元数据
  getModuleMetadata(id) {
    const module = this.modules.get(id)
    return module ? module.metadata : null
  }

  // 设置模块的元数据
  setModuleMetadata(id, metadata) {
    const module = this.addModule(id)
    module.metadata = { ...module.metadata, ...metadata }
  }

  // 获取模块树
  getModuleTree(id) {
    const module = this.modules.get(id)
    if (!module) return null

    const tree = {
      id: module.id,
      dependencies: [],
    }

    for (const dep of module.dependencies) {
      tree.dependencies.push(this.getModuleTree(dep))
    }

    return tree
  }
}

export { ModuleGraph }
