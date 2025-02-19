import { message } from "./utils.js"

export default {
  render() {
    return `<div>${message}</div>`
  },
}

console.log("121")

if (import.meta.hot) {
  import.meta.hot.accept("/vite/utils.js", (newModule) => {
    console.log("App.js updated:", newModule.message)
  })
}
