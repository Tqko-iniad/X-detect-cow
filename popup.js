const DEFAULT_SETTINGS = {
  keyword: "うし",
  desktopNotifications: true,
  pageToast: true
};

const keywordInput = document.getElementById("keyword");
const desktopNotificationsInput = document.getElementById("desktopNotifications");
const pageToastInput = document.getElementById("pageToast");
const statusText = document.getElementById("status");

let statusTimer;

function showStatus(message) {
  window.clearTimeout(statusTimer);
  statusText.textContent = message;
  statusTimer = window.setTimeout(() => {
    statusText.textContent = "";
  }, 1600);
}

function saveSettings() {
  const keyword = keywordInput.value.trim() || DEFAULT_SETTINGS.keyword;
  const nextSettings = {
    keyword,
    desktopNotifications: desktopNotificationsInput.checked,
    pageToast: pageToastInput.checked
  };

  chrome.storage.sync.set(nextSettings, () => {
    if (keywordInput.value !== keyword) {
      keywordInput.value = keyword;
    }

    showStatus("保存しました");
  });
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
  keywordInput.value = items.keyword || DEFAULT_SETTINGS.keyword;
  desktopNotificationsInput.checked = Boolean(items.desktopNotifications);
  pageToastInput.checked = Boolean(items.pageToast);
});

keywordInput.addEventListener("change", saveSettings);
desktopNotificationsInput.addEventListener("change", saveSettings);
pageToastInput.addEventListener("change", saveSettings);
