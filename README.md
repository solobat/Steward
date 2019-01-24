<p align="center"><img src="https://user-images.githubusercontent.com/1894203/50375271-c898c800-0635-11e9-9b48-6e87191cab7f.png" /></p>
<h1 align="center">Steward</h1>
<p align="center">A command launcher for Chrome/Firefox</p>
<p align="center">
   <a href="https://github.com/solobat/Steward/releases"><img src="https://img.shields.io/badge/lastest_version-3.6.4-blue.svg"></a>
   <a target="_blank" href="https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd"><img src="https://img.shields.io/badge/download-_chrome_webstore-brightgreen.svg"></a>
   <a href="http://static.oksteward.com/steward-3.6.4.crx"><img src="https://img.shields.io/badge/download-_crx-brightgreen.svg"></a>
   <a target="_blank" href="https://addons.mozilla.org/firefox/addon/steward-a-command-launcher/"><img src="https://img.shields.io/badge/download-_firefox_addon-DD512A.svg"></a>

</p>

***

### Install：
- [Chrome WebStore](https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd)
- [crx Download](http://static.oksteward.com/steward-3.6.4.crx)

- [Firefox Addons](https://addons.mozilla.org/firefox/addon/steward-a-command-launcher/)

### Usage
> Use the commands to complete most of the operation in the browser

- [Document](http://oksteward.com/steward-documents/)
- [中文版文档](http://oksteward.com/steward-documents/zh/)
- [论坛](http://bbs.oksteward.com)
---
#### Screenshots:
![help](https://i.imgur.com/r0zZGR0.png)
newtab mode

![content box](https://i.imgur.com/pWDNBEV.png)
page mode

![workflows](https://i.imgur.com/JefFHhT.png)
workflows

![plugins](https://i.imgur.com/QfOJ2oD.png)
install plugins

#### Videos:
- [youtube](https://www.youtube.com/watch?v=SJ8T_Mbiyes)
- [优酷](http://list.youku.com/albumlist/show/id_51350050)

#### Shortcut keys:
- By default to open Steward in New Tab or you can use :
  - in popup
    - Mac: <kbd>Command ⌘</kbd> + <kbd>K</kbd>
    - Windows and Linux: <kbd>Ctrl</kbd> + <kbd>K</kbd>
  - in websites
    - Mac: <kbd>Command ⌘</kbd> + <kbd>J</kbd>
    - Windows and Linux: <kbd>Ctrl</kbd> + <kbd>J</kbd>
- Alternatively, in Google Chrome, you can go to the URL `chrome://extensions` and scroll to the bottom and click **Keyboard shortcuts**

#### Install plugins
[plugins repo](https://github.com/Steward-launcher/steward-plugins)

```
## install
spm install

## uninstall
spm uninstall
```

#### Development
##### Plugins
[plugin api](http://oksteward.com/steward-documents/plugins/plugins.html#plugin-development)

##### Steward
Please start with the develop branch
````
# node >= v7.5
npm install

# dev for steward
npm run dev

# dev for Steward Lite
npm run dev:lite

# build for steward(MacOS)
npm run prod

# build for Steward Lite(MacOS)
npm run prod:lite
````

#### Sponsor:

<div style="display: flex;justify-content: space-around;">
    <div>
        <h4>WeChat</h4>
        <img src="http://static.oksteward.com/IMG_2180.jpg" width="250" alt="WeChat" />
    </div>
    <div>
        <h4>Alipay</h4>
        <img src="http://static.oksteward.com/alipay3.jpg" width="250" alt="Alipay" />
    </div>
</div>
<div>
    <h4>PayPal:</h4> Please click <a href="https://paypal.me/tomasy/5" target="_blank">Payment Link</a>
</div>
<div>
    <h4>BTC: </h4>1EY57mUdurFnjCfLfcNxFyxnC36iMKYh8
</div>
<div>
    <h4>ETH: </h4>0xafBE53c0f9BEC80cc615d43B011497F316C039B5
</div>

---
#### License:
[![license-badge]][license-link]

<!-- Link -->
[version-badge]:    https://img.shields.io/badge/lastest_version-3.6.4-blue.svg
[version-link]:     https://github.com/solobat/Steward
[chrome-badge]:     https://img.shields.io/badge/download-_chrome_webstore-brightgreen.svg
[chrome-link]:      https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd
[offline-badge]:    https://img.shields.io/badge/download-_crx-brightgreen.svg
[offline-link]:     http://static.oksteward.com/steward-3.6.4.crx
[license-badge]:    https://img.shields.io/github/license/mashape/apistatus.svg
[license-link]:     https://opensource.org/licenses/MIT
