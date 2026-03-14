import Toast from 'toastr';
import { browser } from 'webextension-polyfill-ts';

export default class ItemsStorage {
  name: string;
  key: string;
  norepeat: any;
  appName?: any;
  constructor(name, key, norepeat) {
    this.name = name;
    this.key = key;
    this.norepeat = norepeat;
  }

  filter(item, target) {
    return item !== target;
  }

  removeItem(target) {
    return this.getItems().then(resp => {
      const others = resp.filter(item => {
        return this.filter(item, target);
      });

      this.log('remove', target);
      return browser.storage.sync.set({
        [this.key]: others,
      });
    });
  }

  isRepeat(list, target) {
    return list.indexOf(target) !== -1;
  }

  addItem(item) {
    if (item) {
      return this.getItems().then((items = []) => {
        if (this.norepeat) {
          if (!this.isRepeat(items, item)) {
            items.push(item);
          } else {
            this.log('add', item, 'cannot add repeatedly');

            return Promise.reject('');
          }
        } else {
          items.push(item);
        }

        this.log('add', item);

        return browser.storage.sync.set({
          [this.key]: items,
        });
      });
    } else {
      return Promise.reject('no item');
    }
  }

  getItems() {
    return browser.storage.sync.get(this.key).then(results => {
      return results[this.key];
    });
  }

  log(action, item, msg?) {
    const resultStr = msg ? `unsuccessfully: ${msg}` : 'successfully';

    Toast.success(
      `${action} ${this.key} [${item}] ${resultStr}`,
      this.appName,
      { timeOut: 1000 },
    );
  }
}
