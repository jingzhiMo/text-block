import {
  $,
  makeId,
  generateClass
} from './util.js'
import {
  RULE_KEY,
  STATUS_KEY,
  DOMAIN_STATUS_KEY,
  RUNNING_STATUS,
  INACTIVE_STATUS,
  BLACK_LIST,
  WHITE_LIST
} from './constant.js'
import {
  getStorage,
  setStorage
} from './storage.js'

const BASE_BTN_CLASS = 'tb-btn tb-btn__default'
const START_BTN_CLASS = 'tb-btn__primary'
const STOP_BTN_CLASS = 'tb-btn__danger'

let domainStatus = BLACK_LIST
let domainStatusMap = null

// click button
const $startBtn = $('#tb-start-btn')[0]
const $stopBtn = $('#tb-stop-btn')[0]
const $reloadBtn = $('#tb-reload-btn')[0]
const $addBtn = $('#tb-add-rule')[0]
const $toggleDomainStatusBtn = $('#tb-domain-status-btn')[0]
const $domainBtn = $('#tb-domain-btn')[0]
const $domain = $('#tb-current-domain')[0]

/**
 * @description  获取当前的所有规则
 * @returns {Array} 所有的规则
*/
function loadRule() {
  const ruleList = $('.tb-rule:not(#tb-rule-template)')
  const result = []

  ruleList.forEach(ruleElement => {
    let rule = {
      type: $('.tb-rule__select', ruleElement)[0].value,
      content: $('.tb-rule__content', ruleElement)[0].value.trim(),
      replace: $('.tb-rule__replace', ruleElement)[0].value
    }

    result.push(rule)
  })

  return result.filter(rule => !!rule.content)
}

/**
 * @description  添加规则
 */
function addRule(data) {
  let template = $('#tb-rule-template')[0].cloneNode(true)
  let wrap = $('.tb-rule-list')[0]
  let closeBtn = $('.tb-rule__close', template)[0]

  // 新增的规则需要填入数据
  if (data) {
    $('.tb-rule__select', template)[0].value = data.type
    $('.tb-rule__content', template)[0].value = data.content
    $('.tb-rule__replace', template)[0].value = data.replace
  }

  // 删除规则
  const templateId = makeId(5)
  closeBtn.addEventListener('click', function() {
    template.remove()
    setStorage(RULE_KEY, loadRule())
  })
  template.removeAttribute('id')
  template.id = templateId
  wrap.appendChild(template)
}

/**
 * @description 启动block
 */
async function start(event) {
  const { target } = event

  target.className = BASE_BTN_CLASS
  target.disabled = true
  $stopBtn.className = generateClass(BASE_BTN_CLASS, STOP_BTN_CLASS)
  $stopBtn.disabled = false
  $reloadBtn.className = generateClass(BASE_BTN_CLASS, START_BTN_CLASS)
  $reloadBtn.disabled = false
  await setStorage(STATUS_KEY, RUNNING_STATUS)
  reload()
}

/**
 * @description 停止block
*/
function stop(event) {
  const { target } = event

  target.className = BASE_BTN_CLASS
  target.disabled = true
  $startBtn.className = generateClass(BASE_BTN_CLASS, START_BTN_CLASS)
  $startBtn.disabled = false
  $reloadBtn.className = BASE_BTN_CLASS
  $reloadBtn.disabled = false
  setStorage(STATUS_KEY, INACTIVE_STATUS)
}

/**
 * @description  刷新当前替换规则，通知content
*/
async function reload() {
  const rule = loadRule()
  await setStorage(RULE_KEY, rule)
  chrome.tabs.query({ active: true, currentWindow: true }, tabList => {
    chrome.tabs.sendMessage(tabList[0].id, { reload: true, rule })
  })
}

/**
 * @description 切换域名黑白名单状态
 */
function toggleDomainStatus(ev) {
  const element = ev.target

  if (domainStatus === BLACK_LIST) {
    element.className = element.className.replace(domainStatus, '')
    $domainBtn.className = $domainBtn.className.replace(domainStatus, '')
    domainStatus = WHITE_LIST
    element.innerHTML = WHITE_LIST
  } else {
    let clazz = ` ${BLACK_LIST}`
    element.className += clazz
    $domainBtn.className += clazz
    domainStatus = BLACK_LIST
    element.innerHTML = BLACK_LIST
  }

  setDomainListBtn()
}

/**
 * @description 把当前域名添加/移除到对应的名单中
 */
async function domainHandler(ev) {
  const currentDomain = $domain.value
  const value = new Set(domainStatusMap[currentDomain])
  const element = ev.target
  const isBlacklist = domainStatus === BLACK_LIST ? 1 : 0

  // 删除该域名
  if (value.has(isBlacklist)) {
    value.delete(isBlacklist)
    domainStatusMap[currentDomain] = Array.from(value)
    setDomainListBtn(false)
  } else {
    // 增加该域名
    domainStatusMap[currentDomain] = Array.from(value.add(isBlacklist))
    setDomainListBtn(true)
  }

  await setStorage(DOMAIN_STATUS_KEY, domainStatusMap)
}

/**
 * @description 设置域名处理按钮的状态
 * @param inList {Boolean} 当前域名是否在列表中
 */
function setDomainListBtn(...arg) {
  function updateHTML(inList) {
    if (inList) {
      $domainBtn.innerHTML = 'Remove'
    } else {
      $domainBtn.innerHTML = 'Add To List'
    }
  }

  if (arg.length) {
    updateHTML(...arg)
    return
  }
  const currentDomain = $domain.value
  const domainValue = new Set(domainStatusMap[currentDomain])
  const isBlacklist = domainStatus === BLACK_LIST ? 1 : 0

  updateHTML(domainValue ? domainValue.has(isBlacklist) : false)
}

$addBtn.addEventListener('click', () => addRule())
$startBtn.addEventListener('click', start)
$stopBtn.addEventListener('click', stop)
$reloadBtn.addEventListener('click', reload)
$toggleDomainStatusBtn.addEventListener('click', toggleDomainStatus)
$domainBtn.addEventListener('click', domainHandler)

chrome.tabs.query({
  active: true,
  currentWindow: true
}, result => {
  if (!result.length) return

  const httpPattern = /^http/
  const domainPattern = /^https?\:[\/]{2}([^\/]*)/
  const rootDomainPattern = /([^\.]+.\w+$)/
  const { url } = result[0]

  if (!httpPattern.test(url)) return

  const rootDomain = url.match(domainPattern)[1].match(rootDomainPattern)[1]
  $domain.value = rootDomain
})

// 读取之前已写入的规则、按钮状态、黑白名单
getStorage([
  RULE_KEY,
  STATUS_KEY,
  DOMAIN_STATUS_KEY
]).then(result => {
  // 自定义的规则
  if (result[RULE_KEY]) {
    result[RULE_KEY].forEach(rule => (addRule(rule)))
  }

  // 按钮状态
  const status = result[STATUS_KEY]
  // 启动中
  if (status && status === RUNNING_STATUS) {
    $stopBtn.className = generateClass(BASE_BTN_CLASS, STOP_BTN_CLASS)
    $stopBtn.disabled = false
    $startBtn.className = BASE_BTN_CLASS
    $startBtn.disabled = true
    $reloadBtn.className = generateClass(BASE_BTN_CLASS, START_BTN_CLASS)
    $reloadBtn.disabled = false
  } else {
    $startBtn.className = generateClass(BASE_BTN_CLASS, START_BTN_CLASS)
    $stopBtn.disabled = false
    $stopBtn.className = BASE_BTN_CLASS
    $stopBtn.disabled = true
    $reloadBtn.className = BASE_BTN_CLASS
    $reloadBtn.disabled = true
  }

  // 黑白名单
  domainStatusMap = result[DOMAIN_STATUS_KEY] || {}
  toggleDomainStatus({ target: $toggleDomainStatusBtn })
})
// chrome.storage.local.get(
//   [
//     RULE_KEY,
//     STATUS_KEY,
//     DOMAIN_STATUS_KEY
//   ],
//   result => {
//   }
// )
