# text-block
A Chrome Extension to block or replace some text in website. [Download Url](https://chrome.google.com/webstore/detail/textblock/kepcjelnoffhedodofbggbkbdckokohb?utm_source=chrome-ntp-icon)

## Extension Ability
1. Block some text in all website by some rule you set.
2. Replace some text in all website by some rule you set.

What scenario use `text-block`?

1. Usually hide the word that you don't like
2. Sometimes parent can block sensitive word for children.
3. Play a joke with your friends.
4. Block bullet screen(probably it is called 'danmaku') in HTML5 Video. For Example, [bilibili.com](https://www.bilibili.com), [douyu.com](https://www.douyu.com) etc.

## Match Rule Support
Now`text-block`support two kinds of rule:

1. `text match`, exact match the `text`, not fuzzy search.
2. `RegExp match`, `regexp` is javascript language support type. [mdn](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

## Usage Step
1. install extension from [chrome app](https://chrome.google.com/webstore/detail/textblock/kepcjelnoffhedodofbggbkbdckokohb?utm_source=chrome-ntp-icon)

2. click `text-block` icon and add rule

![step1.png](https://i.loli.net/2020/01/14/tSd7sBz9eWZkYwA.png)

3. input your rule content.Every rule contain three element.

* First is `match type`. You can select `text match` or `RegRxp match`. `text match` is exact match, it is easy to set up. `RegExp match` is more powerful, such as `/[Ss]ome/` string is match.
* Second is `match rule`. If you select `text match` type, this is match `text`. If you select `RegExp match`, this is `RegExp` object.
* Third is `replace value`. Usually if you want to block text, `replace value` is not necessary to set up. If you want to replace with other value, you can input some text. It is a pure string to replace.

![step2.png](https://i.loli.net/2020/01/14/kdtQgOu59xKZzWl.png)

4. click `start` button to start 'block' process.
*If it not work, you can refrest website.*
![step3.png](https://i.loli.net/2020/01/14/eHJ8zVhokQS493m.png)

5. If you want to add a new rule or delete a rule on 'starting' status, you can click `reload` button after your setting.
![step4.png](https://i.loli.net/2020/01/14/7KRjlLB8ce1XFCv.png)

## More Usage
If extension version `> 0.8.0`, you can set domain mode: `blacklist` or `whitelist`. By default, domain mode is `blacklist`.

### Domain Mode
You can click *`blacklist`* to toggle domain mode.

![domainmode.png](https://i.loli.net/2020/02/24/CfqbF2i1XQ8hJYx.png)

You can click *`Add to List`* to add current domain in `blacklist` or `whitelist`.

![domain add.png](https://i.loli.net/2020/02/24/hZEb9H1PsMWYkvw.png)

*P.S: The same domain can save in `blacklist` and `whitelist` which work in different mode.*

If you set mode as `blacklist`, it means `text-block` will not work in list of domain.

For example, `blacklist` content is:

```plain
foo.com
bar.com
```
`text-block` will not work in `foo.com` and `bar.com`

If you set mode as `whitelist`, it means `text-block` will **only work** in list of domain.

For example, `whitelist` content is:

```plain
foo.com
bar.com
```
`text-block` will **only work** in `foo.com` and `bar.com`
