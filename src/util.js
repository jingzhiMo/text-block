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
