import {
  RULE_KEY,
  STATUS_KEY,
  RUNNING_STATUS,
  DOMAIN_MODE_KEY,
  DOMAIN_LIST_KEY,
  HIGHLIGHT_KEY,
  WHITE_LIST,
  WHITE_LIST_MODE,
  BLACK_LIST_MODE,
  HIGHLIGHT_COLOR,
  DATASET_PROP
} from './constant.js'
import {
  loadRootDomain,
  isValidDomain,
  divTemplate
} from './util.js'
import { getStorage } from './storage.js'

// 忽略的标签
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
// 代替的模式
let REPLACE_PATTERN = []
// 匹配上的元素的队列
const MATCH_QUEUE = []
// 需要进行处理的元素的队列
const REPLACE_QUEUE = []
// 需要更改高亮的元素的队列
const HIGHLIGHT_QUEUE = []

// 匹配元素进行文字处理
let matchHandle = 0
// 对元素进行替换处理
let replaceHandle = 0
// 高亮元素切换处理
let highlightHandle = 0

let observer = null

// 高亮的颜色
let highlightColor = ''

/**
 * @description  使用requestIdleCallback处理替换动作
 */
function matchHandler(deadline) {
  while(MATCH_QUEUE.length && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
    const element = MATCH_QUEUE.shift()
    const text = element.textContent
    let newText = text

    REPLACE_PATTERN.forEach(pattern => {
      let content = pattern.content

      if (pattern.type === 'regexp') {
        const p = /^\/(.*)\/([gimsuy]*)$/

        try {
          if (p.test(content)) {
            const match = content.match(p)
            content = new RegExp(match[1], match[2])
          } else {
            content = new RegExp(content)
          }

          if (content.test(newText)) {
            newText = newText.replace(content, pattern.replace)
          }
        } catch (e) {
          // 正则出错，退级为字符串替换
          newText = newText.replace(pattern.content, pattern.replace)
        }
      } else {
        // 字符串匹配规则
        newText = newText.replace(content, pattern.replace)
      }
    })

    // 需要进行数据替换
    if (newText !== text) {
      // 添加到替换队列
      REPLACE_QUEUE.push({
        element,
        text: newText
      })

      if (!replaceHandle) {
        replaceHandle = requestAnimationFrame(replaceHandler)
      }
    }
  }

  if (!MATCH_QUEUE.length) {
    matchHandle = 0
  } else {
    matchHandle = requestIdleCallback(matchHandler)
  }
}

/**
 * @description  替换元素中的文本
 */
function replaceHandler() {
  if (!REPLACE_QUEUE.length) {
    replaceHandle = 0
    return
  }

  const { element, text } = REPLACE_QUEUE.shift()
  const { parentElement } = element
  const div = divTemplate.cloneNode()
  div.innerText = text
  div.style.backgroundColor = highlightColor

  if (!parentElement) {
    requestAnimationFrame(replaceHandler)
    return
  }

  // e.g: <element>text</element>
  if (parentElement.childNodes.length === 1) {
    parentElement.innerHTML = div.outerHTML
  } else {
    const index = [].findIndex.call(parentElement.childNodes, subElement => subElement === element)

    // e.g:
    // <element>
    //   <i></i>
    //   <span></span>
    //   "text"
    // </element>
    if (index === parentElement.childNodes.length - 1) {
      parentElement.removeChild(element)
      parentElement.appendChild(div)
    } else {
      // e.g:
      // <element>
      //   <i></i>
      //   "text"
      //   <span></span>
      // </element>
      parentElement.removeChild(element)
      parentElement.insertBefore(div, parentElement.childNodes[index])
    }
  }
  requestAnimationFrame(replaceHandler)
}

/**
 * @description  把匹配的元素加入到队列中
 * @param {Array}  elementList  匹配到的元素
 */
function enqueueMatch(elementList) {
  MATCH_QUEUE.push(...elementList)

  if (!matchHandle) {
    matchHandle = requestIdleCallback(matchHandler)
  }
}

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

  const { childNodes } = root

  if (!childNodes || !childNodes.length) return element

  for (let i = 0; i < childNodes.length; i++) {
    switch (childNodes[i].nodeType) {
    // 元素节点
    case 1:
      element = element.concat(matchElement(childNodes[i]))
      break
    // 文本节点
    case 3:
      element.push(childNodes[i])
      break
    }
  }

  return element
}

/**
 * @description  整个页面进行替换
 * @returns {void}
 */
function replaceBody() {
  enqueueMatch(matchElement(document.body))
}

/**
 * @description 匹配已替换的元素
 */
function matchHighlight(root) {
  let element = []

  // 忽略部分标签
  if (IGNORE_TAG[root.nodeName.toLowerCase()]) return element
  if ([1, 3].indexOf(root.nodeType) === -1) return element

  let { children } = root

  if (!children || !children.length) return element

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (child.dataset[DATASET_PROP]) {
      element.push(child)
    } else {
      element = element.concat(matchHighlight(child))
    }
  }

  return element
}

/**
 * @description 处理高亮调整
 */
function highlightHandler() {
  if (!HIGHLIGHT_QUEUE.length) {
    highlightHandle = 0
    return
  }

  const element = HIGHLIGHT_QUEUE.shift()

  element.style.backgroundColor = highlightColor
  requestAnimationFrame(highlightHandler)
}

/**
 * @description 启动监听document发生变化
 */
function startObserve() {
  observer = new MutationObserver(mutationRecordList => {
    mutationRecordList.forEach(record => {
      // 仅在新增节点进行处理
      [].filter
        .call(record.addedNodes, node => {
          // comment node
          if (!node.dataset) {
            return false
          }
          // TODO 多次更改无效？
          return !node.dataset[DATASET_PROP]
        })
        .forEach(node => (enqueueMatch(matchElement(node))))
    })
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true
  })
}

/**
 * @description 当前域名是否需要进行block
 */
async function isBlockDomain() {
  const result = await getStorage([DOMAIN_MODE_KEY, DOMAIN_LIST_KEY])
  const { origin, host } = location
  const rootDomain = loadRootDomain(host)
  const domainList = result[DOMAIN_LIST_KEY]

  if (!isValidDomain(origin)) return false

  // 启用白名单模式
  if (result[DOMAIN_MODE_KEY] === WHITE_LIST) {
    // 当前域名在白名单内
    if (domainList && domainList[rootDomain].indexOf(WHITE_LIST_MODE) !== -1) {
      return true
    }
  } else {
    // 当前域名不在黑名单内
    if (
      !domainList ||
      !domainList[rootDomain] ||
      domainList[rootDomain].indexOf(BLACK_LIST_MODE) === -1
    ) {
      return true
    }
  }

  return false
}

/**
 * @description 设置高亮颜色
 */
function setHighlightColor(color) {
  highlightColor = color || ''
}

// 页面启动，根据规则进行替换
getStorage([
  RULE_KEY,
  STATUS_KEY,
  DOMAIN_MODE_KEY,
  DOMAIN_LIST_KEY,
  HIGHLIGHT_KEY
]).then(async result => {
  if (!result[RULE_KEY] || !result[RULE_KEY].length || result[STATUS_KEY] !== RUNNING_STATUS) return

  REPLACE_PATTERN = result[RULE_KEY]
  // 首次启动为 DomContentLoaded 事件
  if (await isBlockDomain()) {
    replaceBody()
    startObserve()
  }

  setHighlightColor(result[HIGHLIGHT_KEY] ? HIGHLIGHT_COLOR : '')
})

// 监听来自popup的事件
let lock = false
chrome.runtime.onMessage.addListener(async request => {
  if (request.reload && !lock) {
    lock = true
    REPLACE_PATTERN = request.rule

    if (await isBlockDomain()) {
      replaceBody()
      startObserve()
    }
    lock = false
  }

  if (request.stop) {
    observer.disconnect()
  }

  // 高亮切换
  if (request.highlight) {
    const result = await getStorage([STATUS_KEY, HIGHLIGHT_KEY])

    setHighlightColor(result[HIGHLIGHT_KEY] ? HIGHLIGHT_COLOR : '')
    if (result[STATUS_KEY] === RUNNING_STATUS) {
      HIGHLIGHT_QUEUE.push(...matchHighlight(document.body))

      if (!highlightHandle) {
        highlightHandle = requestAnimationFrame(highlightHandler)
      }
    }
  }
})
