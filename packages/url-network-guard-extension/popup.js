const STORAGE_DEFAULTS = {
  isEnabled: true,
  blacklistRaw: "",
  whitelistRaw: "",
  blacklist: [],
  whitelist: [],
};

const State = {
  Allowed: "allowed",
  Blocked: "blocked",
  Disabled: "disabled",
  Neutral: "neutral",
};

const StateLabels = {
  [State.Allowed]: "允许",
  [State.Blocked]: "已阻断",
  [State.Disabled]: "已关闭",
  [State.Neutral]: "未命中",
};

let feedbackTimerId = 0;

const parseList = (value) => {
  const seen = new Set();

  return String(value || "")
    .split(/[,\s]+/)
    .reduce((items, entry) => {
      const item = entry.trim();

      if (!item || seen.has(item)) {
        return items;
      }

      seen.add(item);
      items.push(item);
      return items;
    }, []);
};

const isHttpTabUrl = (url) => /^https?:\/\//i.test(String(url || ""));

const findMatchedToken = (url, tokens) => tokens.find((token) => url.includes(token)) || "";

const getMatchState = ({ url, blacklist, whitelist, isEnabled }) => {
  if (!isEnabled) {
    return {
      state: State.Disabled,
      matchedToken: "",
    };
  }

  if (!isHttpTabUrl(url)) {
    return {
      state: State.Neutral,
      matchedToken: "",
    };
  }

  const whitelistToken = findMatchedToken(url, whitelist);

  if (whitelistToken) {
    return {
      state: State.Allowed,
      matchedToken: whitelistToken,
    };
  }

  const blacklistToken = findMatchedToken(url, blacklist);

  if (blacklistToken) {
    return {
      state: State.Blocked,
      matchedToken: blacklistToken,
    };
  }

  return {
    state: State.Neutral,
    matchedToken: "",
  };
};

const getElements = () => ({
  enabledInput: document.querySelector("#enabledInput"),
  enabledLabel: document.querySelector("#enabledLabel"),
  blacklistInput: document.querySelector("#blacklistInput"),
  whitelistInput: document.querySelector("#whitelistInput"),
  rulesForm: document.querySelector("#rulesForm"),
  saveButton: document.querySelector("#saveButton"),
  statusText: document.querySelector("#statusText"),
  statusDot: document.querySelector("#statusDot"),
  currentUrl: document.querySelector("#currentUrl"),
  countText: document.querySelector("#countText"),
  feedbackText: document.querySelector("#feedbackText"),
});

const sendRuntimeMessage = async (message) => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error("Runtime message failed", error);
    return {
      ok: false,
      error: error.message || "Runtime message failed",
    };
  }
};

const queryActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tab || null;
};

const updateCountText = (elements) => {
  const blacklist = parseList(elements.blacklistInput.value);
  const whitelist = parseList(elements.whitelistInput.value);

  elements.countText.textContent = `黑 ${blacklist.length} / 白 ${whitelist.length}`;
};

const updateEnabledLabel = (elements) => {
  elements.enabledLabel.textContent = elements.enabledInput.checked ? "已开启" : "已关闭";
};

const setFeedback = ({ elements, text }) => {
  window.clearTimeout(feedbackTimerId);
  elements.feedbackText.textContent = text;

  if (text) {
    feedbackTimerId = window.setTimeout(() => {
      elements.feedbackText.textContent = "";
    }, 2200);
  }
};

const renderCurrentUrl = ({ elements, url }) => {
  const visibleUrl = url || "-";

  elements.currentUrl.textContent = visibleUrl;
  elements.currentUrl.title = visibleUrl;
};

const renderState = ({ elements, state, matchedToken }) => {
  const label = StateLabels[state] || StateLabels[State.Neutral];
  const suffix = matchedToken ? `：${matchedToken}` : "";

  elements.statusText.textContent = `${label}${suffix}`;
  elements.statusDot.className = `status-dot is-${state || State.Neutral}`;
};

const renderPreviewState = async (elements) => {
  const tab = await queryActiveTab();
  const url = tab?.url || "";
  const blacklist = parseList(elements.blacklistInput.value);
  const whitelist = parseList(elements.whitelistInput.value);
  const match = getMatchState({
    url,
    blacklist,
    whitelist,
    isEnabled: elements.enabledInput.checked,
  });

  renderCurrentUrl({
    elements,
    url,
  });

  renderState({
    elements,
    state: match.state,
    matchedToken: match.matchedToken,
  });
};

const refreshBackgroundState = async (elements) => {
  const response = await sendRuntimeMessage({
    type: "guard:get-active-state",
  });

  if (!response?.ok) {
    setFeedback({
      elements,
      text: response?.error || "后台状态读取失败",
    });
    return;
  }

  renderCurrentUrl({
    elements,
    url: response.url || "",
  });

  renderState({
    elements,
    state: response.state,
    matchedToken: response.matchedToken,
  });
};

const loadStoredRules = async (elements) => {
  const stored = await chrome.storage.local.get(STORAGE_DEFAULTS);

  elements.enabledInput.checked = stored.isEnabled !== false;
  elements.blacklistInput.value = stored.blacklistRaw || "";
  elements.whitelistInput.value = stored.whitelistRaw || "";

  updateEnabledLabel(elements);
  updateCountText(elements);
  await renderPreviewState(elements);
  await refreshBackgroundState(elements);
};

const saveRules = async (elements) => {
  const isEnabled = elements.enabledInput.checked;
  const blacklistRaw = elements.blacklistInput.value;
  const whitelistRaw = elements.whitelistInput.value;
  const blacklist = parseList(blacklistRaw);
  const whitelist = parseList(whitelistRaw);

  await chrome.storage.local.set({
    isEnabled,
    blacklistRaw,
    whitelistRaw,
    blacklist,
    whitelist,
  });

  await sendRuntimeMessage({
    type: "guard:refresh-all",
  });

  updateCountText(elements);
  await refreshBackgroundState(elements);
};

const bindEvents = (elements) => {
  elements.enabledInput.addEventListener("change", () => {
    updateEnabledLabel(elements);
    elements.saveButton.disabled = true;
    void saveRules(elements)
      .catch((error) => {
        console.error("Failed to save enabled state", error);
        setFeedback({
          elements,
          text: error.message || "保存失败",
        });
      })
      .finally(() => {
        elements.saveButton.disabled = false;
      });
  });

  elements.blacklistInput.addEventListener("input", () => {
    updateCountText(elements);
    void renderPreviewState(elements);
  });

  elements.whitelistInput.addEventListener("input", () => {
    updateCountText(elements);
    void renderPreviewState(elements);
  });

  elements.rulesForm.addEventListener("submit", (event) => {
    event.preventDefault();

    elements.saveButton.disabled = true;

    void saveRules(elements)
      .then(() => {
        setFeedback({
          elements,
          text: "已保存",
        });
      })
      .catch((error) => {
        console.error("Failed to save rules", error);
        setFeedback({
          elements,
          text: error.message || "保存失败",
        });
      })
      .finally(() => {
        elements.saveButton.disabled = false;
      });
  });
};

const init = async () => {
  const elements = getElements();

  bindEvents(elements);
  await loadStoredRules(elements);
};

document.addEventListener("DOMContentLoaded", () => {
  void init().catch((error) => {
    console.error("Popup initialization failed", error);
  });
});
