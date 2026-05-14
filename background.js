chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "USHI_DETECTED") {
    return;
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: `「${message.keyword || "うし"}」を検出しました`,
    message: "Xの投稿入力欄に指定した文字列が入力されています。"
  });
});
