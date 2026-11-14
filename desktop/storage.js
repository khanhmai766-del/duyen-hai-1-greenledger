'use strict';

const desktopBridge = window.chrome.webview.hostObjects.sync.inventoryStorage;
const desktopStorage = {
  getItem() {
    return desktopBridge.Read() ?? null;
  },
  setItem(key, json, expected) {
    desktopBridge.Save(expected ?? '', json);
  },
};
