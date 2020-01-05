console.log('this is content v5')
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
let REPLACE_PATTERN = []
/**
 * @description  深度遍历获取所有text的标签
 * @param  {HTMLElement} root  以该节点开始深度查找
 * @returns {HTMLElement[]} element  所有匹配上的 element
*/
function matchElement(root) {
  let element = []

  // 忽略部分标签
  if (IGNORE_TAG[root.nodeName.toLowerCase()]) return element
  if ([1, 3].indexOf(root.nodeType) === -1) return element

  const { childNodes, children } = root

  if (!childNodes || !childNodes.length) return element

  for (let i = 0; i < childNodes.length; i++) {
    // 文本节点
    if (childNodes[i].nodeType === 3) {
      element.push(childNodes[i])
    }
  }

  if (!children || !children.length) return element

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
      let content = pattern.content
      content.trim()

      if (pattern.type === 'regexp') {
        const p = /^\/(.*)\/([gimsuy]*)$/

        if (p.test(content)) {
          const match = content.match(p)
          content = new RegExp(match[1], match[2])
        } else {
          content = new RegExp(content)
        }

        if (content.test(newText)) {
          newText = newText.replace(content, pattern.replace)
        }
      } else {
        // 字符串匹配规则
        newText = newText.replace(content, pattern.replace)
      }
    })

    if (newText !== text) {
      textElement[i].textContent = newText
    }
  }
}

chrome.storage.local.get(['tb_rule', 'tb_status'], result => {
  console.log('rule, result', result)
  if (!result.tb_rule || !result.tb_rule.length || result.tb_status !== 'running') return

  console.log('begin block')
  REPLACE_PATTERN = result.tb_rule
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
})
