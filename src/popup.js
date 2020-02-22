import {
  $,
  makeId,
  generateClass,
  isValidDomain,
  loadRootDomain,
  loadCurrentTab
} from './util.js'
import {
  RULE_KEY,
  STATUS_KEY,
  DOMAIN_MODE_KEY,
  DOMAIN_LIST_KEY,
  RUNNING_STATUS,
  INACTIVE_STATUS,
  BLACK_LIST,
  WHITE_LIST,
  BLACK_LIST_MODE,
  WHITE_LIST_MODE
} from './constant.js'
import {
  getStorage,
  setStorage
} from './storage.js'

const BASE_BTN_CLASS = 'tb-btn tb-btn__default'
const START_BTN_CLASS = 'tb-btn__primary'
const STOP_BTN_CLASS = 'tb-btn__danger'

let domainMode = null
let domainListMap = null

// click button
const $startBtn = $('#tb-start-btn')[0]
const $stopBtn = $('#tb-stop-btn')[0]
const $reloadBtn = $('#tb-reload-btn')[0]
const $addBtn = $('#tb-add-rule')[0]
const $domainModeBtn = $('#tb-domain-mode-btn')[0]
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
async function stop(event) {
  const { target } = event

  target.className = BASE_BTN_CLASS
  target.disabled = true
  $startBtn.className = generateClass(BASE_BTN_CLASS, START_BTN_CLASS)
  $startBtn.disabled = false
  $reloadBtn.className = BASE_BTN_CLASS
  $reloadBtn.disabled = false
  await setStorage(STATUS_KEY, INACTIVE_STATUS)
  sendMessage({ stop: true })
}

/**
 * @description  刷新当前替换规则，通知content
*/
async function reload() {
  const rule = loadRule()
  await setStorage(RULE_KEY, rule)
  sendMessage({ reload: true, rule })
}

/**
 * @description 发送通知到 content.js
 * @param {any} message
 */
function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabList => {
    chrome.tabs.sendMessage(tabList[0].id, message)
  })
}

/**
 * @description 切换域名黑白名单模式
 */
async function toggleDomainMode() {
  if (domainMode === BLACK_LIST) {
    domainMode = WHITE_LIST
  } else {
    domainMode = BLACK_LIST
  }

  setDomainModeBtn()
  setDomainListBtn()
  await setStorage(DOMAIN_MODE_KEY, domainMode)
}

/**
 * @description 把当前域名添加/移除到对应的名单中
 */
async function domainHandler() {
  const currentDomain = $domain.value
  const value = new Set(domainListMap[currentDomain])
  const mode = domainMode === BLACK_LIST ? BLACK_LIST_MODE : WHITE_LIST_MODE

  // 删除该域名
  if (value.has(mode)) {
    value.delete(mode)
    domainListMap[currentDomain] = Array.from(value)
    setDomainListBtn(false)
  } else {
    // 增加该域名
    domainListMap[currentDomain] = Array.from(value.add(mode))
    setDomainListBtn(true)
  }

  await setStorage(DOMAIN_LIST_KEY, domainListMap)
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

  $domainBtn.className = `tb-btn tb-btn__info small tb-domain__btn ${domainMode}`
  if (arg.length) {
    updateHTML(...arg)
    return
  }
  const currentDomain = $domain.value
  const domainValue = new Set(domainListMap[currentDomain])
  const mode = domainMode === BLACK_LIST ? BLACK_LIST_MODE : WHITE_LIST_MODE

  updateHTML(domainValue ? domainValue.has(mode) : false)
}

/**
 * @description 设置切换域名模式的按钮
 */
function setDomainModeBtn() {
  $domainModeBtn.className = `tb-btn tb-btn__info small tb-status__label ${domainMode}`
  $domainModeBtn.innerHTML = domainMode
}

$addBtn.addEventListener('click', () => addRule())
$startBtn.addEventListener('click', start)
$stopBtn.addEventListener('click', stop)
$reloadBtn.addEventListener('click', reload)
$domainModeBtn.addEventListener('click', toggleDomainMode)
$domainBtn.addEventListener('click', domainHandler)

async function init() {
  const tabMessage = await loadCurrentTab()

  if (tabMessage.length) {
    const domainPattern = /^https?:[/]{2}([^/]*)/
    const { url } = tabMessage[0]

    if (!isValidDomain(url)) {
      [
        $addBtn,
        $startBtn,
        $stopBtn,
        $reloadBtn,
        $domainModeBtn,
        $domainBtn
      ].forEach(btn => (btn.setAttribute('disabled', true)))
      return
    }

    $domain.value = loadRootDomain(url.match(domainPattern)[1])
  }

  // 读取之前已写入的规则、按钮状态、黑白名单
  const result = await getStorage([
    RULE_KEY,
    STATUS_KEY,
    DOMAIN_LIST_KEY,
    DOMAIN_MODE_KEY
  ])
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
  domainListMap = result[DOMAIN_LIST_KEY] || {}
  domainMode = result[DOMAIN_MODE_KEY] || BLACK_LIST
  setDomainModeBtn()
  setDomainListBtn()
}

init()
