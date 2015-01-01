Ikkyu
===============

Easy Extensions / Tabs / History / Translation etc.

---
## Update
### 1.3.0
+ 优化Auth

---
## Useage
+ `on`/`off` + `space` 显示所有**未启用** / **启用中**的扩展
+ `on`/`off` + text 查找匹配相应的扩展
+ `run` 命令启动App
+ `tab` 命令查找并定位到打开的标签页
+ `his` 命令查找历史记录并新标签打开
+ `yd` 有道词典
+ `todo` 待办事项
+ `po` 命令查找pocket

---
## TODOS
+ auth通用类抽象
+ 考虑有条件的保留上一次的命令
+ `his` 改进：增加中文匹配，添加url显示
+ `del` 命令删除相应插件
+ 命令执行后去掉此次的 text
+ 输入 trigger 后给出相应的提示
+ `cls` 清除历史记录
+ [set schema](https://developer.chrome.com/apps/manifest/storage) 了解并运用，以替换on /off 中的sync
