/**
 * @description  写入 storage
 */
export function setStorage(key, value) {
  return new Promise(resolve => {
    const item = {}

    item[key] = value
    chrome.storage.sync.set(item)
    chrome.storage.local.set(item, resolve)
  })
}

/**
 * @description 获取 storage 的值
 */
export function getStorage(keyArr) {
  return new Promise(resolve => {
    chrome.storage.local.get(keyArr, resolve)
  })
}
