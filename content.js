console.log('this is content v3')
const IGNORE_TAG = {
  'script': true,
  'video': true,
  'audio': true,
  'img': true,
  'canvas': true,
  'svg': true,
  'link': true,
  'input': true,
  'source': true,
  'col': true,
  'colgroup': true,
  'hr': true,
  'br': true
}
const REPLACE_PATTERN = [
  { content: '商家', replace: 'shangjia' }
]
/**
 * @description  深度遍历获取所有text的标签
 * @param  {HTMLElement} root  以该节点开始深度查找
 * @returns {HTMLElement[]} element  所有匹配上的 element
*/
function matchElement(root) {
  // 忽略部分标签
  if (IGNORE_TAG[root.nodeName.toLowerCase()]) return []

  if ([1, 3].indexOf(root.nodeType) === -1) return []

  let element = []
  const { childNodes, children } = root

  for (let i = 0; i < childNodes.length; i++) {
    // 文本节点
    if (childNodes[i].nodeType === 3) {
      element.push(childNodes[i])
    }
  }

  for (let i = 0; i < children.length; i++) {
    element = element.concat(matchElement(children[i]))
  }

  return element
}

/**
 * @description  把包含text的html标签进行替换
 * @param  {HTMLElement[]} textElement 需要进行替换的元素组
 * @returns {void}
*/
function replaceElement(textElement) {
  for (let i = 0; i < textElement.length; i++) {
    let text = textElement[i].textContent
    let newText = text

    REPLACE_PATTERN.forEach(pattern => {
      newText = newText.replace(pattern.content, pattern.replace)
    })

    if (newText !== text) {
      textElement[i].textContent = newText
    }
  }
}

// 首次启动为 DomContentLoaded 事件
replaceElement(matchElement(document.body))

const observer = new MutationObserver(mutationRecordList => {
  mutationRecordList.forEach(record => {
    // 仅在新增节点进行处理
    record.addedNodes.forEach(node => {
      let textElement = matchElement(node)

      console.log('match textElement', textElement)
      replaceElement(textElement)
    })
  })
  console.log('callback update observer')
})

observer.observe(document.body, {
  subtree: true,
  childList: true
})
