import { DATASET_PROP } from './constant.js'
export function $ (selector, root) {
  root = root || document
  return root.querySelectorAll(selector)
}


/**
 * @description 生成随机id
 * @param {number} 随机id的长度
 */
export function makeId(length) {
  let result = ''
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

/**
 * @description  根据class名称拼接最终的class
 * @param {string} cx 类名参数
 */
export function generateClass(...cx) {
  return cx.join(' ')
}

/**
 * @description 判断域名是否有效
 * @param {string} domain
 */
export function isValidDomain(domain) {
  const httpPattern = /^http/
  return httpPattern.test(domain)
}

/**
 * @description 获取当前域名的根域名
 * @param {string} domain
 */
export function loadRootDomain(domain) {
  const rootDomainPattern = /([^.]+.\w+$)/
  return domain.match(rootDomainPattern)[1]
}

/**
 * @description 获取当前tab的内容
 */
export function loadCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, resolve)
  })
}

const div = document.createElement('div')

div.style.display = 'inline'
div.dataset[DATASET_PROP] = 1 // tbt: text-block text

export const divTemplate = div
