function $ (selector, root) {
  root = root || document
  return root.querySelectorAll(selector)
}

/**
 * @description 生成随机id
 * @param {number} 随机id的长度
 */
function makeId(length) {
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
function generateClass(...cx) {
  return cx.join(' ')
}

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

const BASE_BTN_CLASS = 'tb-btn tb-btn__default'
const START_BTN_CLASS = 'tb-btn__primary'
const STOP_BTN_CLASS = 'tb-btn__danger'

const RULE_KEY = 'tb_rule'
const STATUS_KEY = 'tb_status'

// 域名黑白名单在 chrome storage 的 key 值名称
const DOMAIN_BLACK_LIST = 'tb_black_list'
const DOMAIN_WHITE_LIST = 'tb_white_list'

const RUNNING_STATUS = 'running'
const INACTIVE_STATUS = 'inactive'

let domainStatus = 'blacklist'

// click button
const $startBtn = $('#tb-start-btn')[0]
const $stopBtn = $('#tb-stop-btn')[0]
const $reloadBtn = $('#tb-reload-btn')[0]
const $addBtn = $('#tb-add-rule')[0]
const $toggleDomainStatusBtn = $('#tb-domain-status-btn')[0]
const $domainBtn = $('#tb-domain-btn')[0]
const $domain = $('#tb-current-domain')[0]

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

  if (domainStatus === 'blacklist') {
    element.className = element.className.replace(domainStatus, '')
    $domainBtn.className = $domainBtn.className.replace(domainStatus, '')
    domainStatus = 'whitelist'
    element.innerHTML = 'white list'
  } else {
    let clazz = ' blacklist'
    element.className += clazz
    $domainBtn.className += clazz
    domainStatus = 'blacklist'
    element.innerHTML = 'black list'
  }
}

/**
 * @description 把当前域名添加/移除到对应的名单中
 */
function domainHandler() {
  console.log('current domain', $domain.value)
}

/**
 * @description  写入 storage
 */
function setStorage(key, value) {
  return new Promise(resolve => {
    const item = {}

    item[key] = value
    chrome.storage.sync.set(item)
    chrome.storage.local.set(item, () => {
      resolve()
    })
  })
}

$addBtn.addEventListener('click', () => addRule())
$startBtn.addEventListener('click', start)
$stopBtn.addEventListener('click', stop)
$reloadBtn.addEventListener('click', reload)
$toggleDomainStatusBtn.addEventListener('click', toggleDomainStatus)
$domainBtn.addEventListener('click', domainHandler)

/*
// 读取之前已写入的规则
chrome.storage.local.get([RULE_KEY], result => {
  if (result[RULE_KEY]) {
    result[RULE_KEY].forEach(rule => (addRule(rule)))
  }
})

// 设置按钮的状态
chrome.storage.local.get([STATUS_KEY], result => {
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
})
*/
