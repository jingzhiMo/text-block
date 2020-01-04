function $ (selector, root) {
  root = root || document
  return root.querySelectorAll(selector)
}

/**
 * @desc 生成随机id
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
 * @desc  添加规则
 */
function addRule() {
  let template = $('#tb-rule-template')[0].cloneNode(true)
  let wrap = $('.tb-rule-list')[0]
  let closeBtn = $('.tb-rule__close', template)[0]

  // 删除规则
  closeBtn.addEventListener('click', function() {
    template.remove()
  })
  template.removeAttribute('id')
  template.id = makeId(5)
  wrap.appendChild(template)
}
$('#add-rule')[0].addEventListener('click', addRule)

/**
 * @desc 启动block数据
 */
function start() {

}
