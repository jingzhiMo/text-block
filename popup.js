// background.js 文件
const background = chrome.extension.getBackgroundPage()

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
 * @description  添加规则
 */
function addRule(data) {
  let template = $('#tb-rule-template')[0].cloneNode(true)
  let wrap = $('.tb-rule-list')[0]
  let closeBtn = $('.tb-rule__close', template)[0]

  // 删除规则
  closeBtn.addEventListener('click', function() {
    template.remove()
  })
  template.removeAttribute('id')
  template.id = makeId(5)

  // 新增的规则需要填入数据
  if (data) {
    $('.tb-rule__select', template)[0].value = data.type
    $('.tb-rule__content', template)[0].value = data.content
    $('.tb-rule__replace', template)[0].value = data.replace
  }
  wrap.appendChild(template)
}

const BASE_BTN_CLASS = 'tb-btn tb-btn__default'
const START_BTN_CLASS = 'tb-btn__primary'
const STOP_BTN_CLASS = 'tb-btn__danger'

const RULE_KEY = 'tb_rule'
const STATUS_KEY = 'tb_status'

const RUNNING_STATUS = 'running'
const INACTIVE_STATUS = 'inactive'

/**
 * @description 启动block
 */
function start(event) {
  const { target } = event

  const ruleList = $('.tb-rule:not(#tb-rule-template)')
  const result = []

  ruleList.forEach(ruleElement => {
    let rule = {
      type: $('.tb-rule__select', ruleElement)[0].value,
      content: $('.tb-rule__content', ruleElement)[0].value,
      replace: $('.tb-rule__replace', ruleElement)[0].value
    }

    result.push(rule)
  })
  target.className = BASE_BTN_CLASS
  $('#tb-stop-btn')[0].className = BASE_BTN_CLASS + ' ' + STOP_BTN_CLASS
  setStorage(RULE_KEY, result)
  setStorage(STATUS_KEY, RUNNING_STATUS)
}

/**
 * @description 停止block
*/
function stop(event) {
  const { target } = event

  target.className = BASE_BTN_CLASS
  $('#tb-start-btn')[0].className = BASE_BTN_CLASS + ' ' + START_BTN_CLASS
  setStorage(STATUS_KEY, INACTIVE_STATUS)
}

/**
 * @description  写入 storage
 */
function setStorage(key, value) {
  const item = {}

  item[key] = value
  chrome.storage.local.set(item, () => {
    console.log('set storage success', key)
  })
}

$('#tb-add-rule')[0].addEventListener('click', () => addRule())
$('#tb-start-btn')[0].addEventListener('click', start)
$('#tb-stop-btn')[0].addEventListener('click', stop)

// 读取之前已写入的规则
chrome.storage.local.get([RULE_KEY], result => {
  console.log('rule, result', result)
  if (result[RULE_KEY]) {
    result[RULE_KEY].forEach(rule => (addRule(rule)))
  }
})

// 设置按钮的状态
chrome.storage.local.get([STATUS_KEY], result => {
  const status = result[STATUS_KEY]
  // 启动中
  if (status && status === RUNNING_STATUS) {
    $('#tb-start-btn')[0].className = BASE_BTN_CLASS
    $('#tb-stop-btn')[0].className = BASE_BTN_CLASS + ' ' + STOP_BTN_CLASS
  } else {
    $('#tb-start-btn')[0].className = BASE_BTN_CLASS + ' ' + START_BTN_CLASS
    $('#tb-stop-btn')[0].className = BASE_BTN_CLASS
  }
})
