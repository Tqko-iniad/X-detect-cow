(() => {
  const DEFAULT_SETTINGS = {
    keyword: "うし",
    desktopNotifications: true,
    pageToast: true
  };

  const NOTICE_ID = "x-ushi-notifier-toast";
  const trackedInputs = new WeakMap();
  let settings = { ...DEFAULT_SETTINGS };
  let lastNotifyAt = 0;

  const editableSelector = [
    '[role="textbox"]',
    '[contenteditable="true"]',
    'textarea',
    'input[type="text"]'
  ].join(",");

  function isTweetComposer(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const textArea = element;
    const accessibleText = [
      textArea.getAttribute("aria-label"),
      textArea.getAttribute("data-testid"),
      textArea.closest('[data-testid="tweetTextarea_0"]')?.getAttribute("data-testid"),
      textArea.closest('[aria-label]')?.getAttribute("aria-label")
    ]
      .filter(Boolean)
      .join(" ");

    if (/tweet|post|reply|ポスト|投稿|返信|ツイート/i.test(accessibleText)) {
      return true;
    }

    return Boolean(
      textArea.closest('[data-testid="tweetTextarea_0"]') ||
        textArea.closest('[data-testid="tweetTextarea_1"]') ||
        textArea.closest('[data-testid="toolBar"]') ||
        textArea.closest('[aria-label*="ポスト"]') ||
        textArea.closest('[aria-label*="投稿"]') ||
        textArea.closest('[aria-label*="返信"]')
    );
  }

  function getText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    }

    return element.innerText || element.textContent || "";
  }

  function showToast() {
    const existing = document.getElementById(NOTICE_ID);
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.id = NOTICE_ID;
    toast.textContent = `「${settings.keyword}」が入力されました`;
    Object.assign(toast.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "2147483647",
      padding: "12px 16px",
      borderRadius: "8px",
      background: "#0f1419",
      color: "#ffffff",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: "14px",
      fontWeight: "700"
    });

    document.documentElement.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function notify() {
    const now = Date.now();
    if (now - lastNotifyAt < 1200) {
      return;
    }

    lastNotifyAt = now;
    if (settings.pageToast) {
      showToast();
    }

    if (!settings.desktopNotifications) {
      return;
    }

    try {
      const result = chrome.runtime.sendMessage({
        type: "USHI_DETECTED",
        keyword: settings.keyword
      });
      result?.catch?.(() => {});
    } catch {
      // The in-page toast is enough when extension messaging is unavailable.
    }
  }

  function inspect(element) {
    if (!isTweetComposer(element)) {
      return;
    }

    const text = getText(element);
    const wasDetected = trackedInputs.get(element) === true;
    const isDetected = Boolean(settings.keyword) && text.includes(settings.keyword);
    trackedInputs.set(element, isDetected);

    if (isDetected && !wasDetected) {
      notify();
    }
  }

  function bindEditable(element) {
    if (!(element instanceof HTMLElement) || trackedInputs.has(element)) {
      return;
    }

    trackedInputs.set(element, false);
    element.addEventListener("input", () => inspect(element), true);
    element.addEventListener("keyup", () => inspect(element), true);
    element.addEventListener("paste", () => window.setTimeout(() => inspect(element), 0), true);
    inspect(element);
  }

  function inspectAll() {
    document.querySelectorAll?.(editableSelector).forEach(inspect);
  }

  function normalizeSettings(items = {}) {
    return {
      ...DEFAULT_SETTINGS,
      ...items,
      keyword: String(items.keyword || DEFAULT_SETTINGS.keyword).trim()
    };
  }

  function loadSettings() {
    chrome.storage?.sync?.get(DEFAULT_SETTINGS, (items) => {
      settings = normalizeSettings(items);
      inspectAll();
    });
  }

  function scan(root = document) {
    if (root instanceof HTMLElement && root.matches(editableSelector)) {
      bindEditable(root);
    }

    root.querySelectorAll?.(editableSelector).forEach(bindEditable);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          scan(node);
        }
      }
    }
  });

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    settings = normalizeSettings({
      ...settings,
      ...Object.fromEntries(
        Object.entries(changes).map(([key, change]) => [key, change.newValue])
      )
    });
    inspectAll();
  });

  loadSettings();
  scan();
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
