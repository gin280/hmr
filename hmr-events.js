// hmr-events.js
const eventNameToCallbacks = new Map()

/**
 * 注册事件回调
 * @param {string} eventName
 * @param {Function} callback
 */
export function onEvent(eventName, callback) {
  if (!eventNameToCallbacks.has(eventName)) {
    eventNameToCallbacks.set(eventName, new Set())
  }
  eventNameToCallbacks.get(eventName).add(callback)
}

/**
 * 注销事件回调
 * @param {string} eventName
 * @param {Function} callback
 */
export function offEvent(eventName, callback) {
  if (eventNameToCallbacks.has(eventName)) {
    eventNameToCallbacks.get(eventName).delete(callback)
  }
}

/**
 * 触发事件
 * @param {string} eventName
 * @param {any} data
 */
export function emitEvent(eventName, data) {
  if (eventNameToCallbacks.has(eventName)) {
    for (const cb of eventNameToCallbacks.get(eventName)) {
      cb(data)
    }
  }
}
