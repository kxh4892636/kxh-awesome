const STORAGE_DEFAULTS = {
  isEnabled: true,
  blacklistRaw: "",
  whitelistRaw: "",
  blacklist: [],
  whitelist: [],
};

const RELEVANT_STORAGE_KEYS = new Set(Object.keys(STORAGE_DEFAULTS));

const RULE_ID_BASE = 1000000;

const State = {
  Allowed: "allowed",
  Blocked: "blocked",
  Disabled: "disabled",
  Neutral: "neutral",
};
let operationQueue = Promise.resolve();

const normalizeList = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(/[,\s]+/);
  const seen = new Set();
  return source.reduce((items, entry) => {
    const item = String(entry || "").trim();
    if (!item || seen.has(item)) {
      return items;
    }
    seen.add(item);
    items.push(item);
    return items;
  }, []);
};

const loadSettings = async () => {
  const stored = await chrome.storage.local.get(STORAGE_DEFAULTS);
  return {
    isEnabled: stored.isEnabled !== false,
    blacklist: Array.isArray(stored.blacklist)
      ? normalizeList(stored.blacklist)
      : normalizeList(stored.blacklistRaw),
    whitelist: Array.isArray(stored.whitelist)
      ? normalizeList(stored.whitelist)
      : normalizeList(stored.whitelistRaw),
  };
};

const isHttpTabUrl = (url) => /^https?:\/\//i.test(String(url || ""));

const findMatchedToken = (url, tokens) => tokens.find((token) => url.includes(token)) || "";

const getMatchState = ({ url, blacklist, whitelist }) => {
  if (!isHttpTabUrl(url)) {
    return {
      state: State.Neutral,
      matchedToken: "",
      reason: "non-web-url",
    };
  }
  const whitelistToken = findMatchedToken(url, whitelist);
  if (whitelistToken) {
    return {
      state: State.Allowed,
      matchedToken: whitelistToken,
      reason: "whitelist",
    };
  }
  const blacklistToken = findMatchedToken(url, blacklist);
  if (blacklistToken) {
    return {
      state: State.Blocked,
      matchedToken: blacklistToken,
      reason: "blacklist",
    };
  }
  return {
    state: State.Neutral,
    matchedToken: "",
    reason: "not-matched",
  };
};

const getRuleIdForTab = (tabId) => RULE_ID_BASE + tabId;

const buildBlockRule = (tabId) => ({
  id: getRuleIdForTab(tabId),
  priority: 1,
  action: {
    type: "block",
  },
  condition: {
    tabIds: [tabId],
    urlFilter: "*",
  },
});

const updateBadge = async ({ tabId, state }) => {
  if (typeof tabId !== "number") {
    return;
  }
  try {
    await chrome.action.setBadgeText({
      tabId,
      text: state === State.Blocked ? "BLOCK" : "",
    });
    if (state === State.Blocked) {
      await chrome.action.setBadgeBackgroundColor({
        tabId,
        color: "#b91c1c",
      });
    }
  } catch (error) {
    console.error("Failed to update badge", error);
  }
};

const removeRuleForTab = async (tabId) => {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [getRuleIdForTab(tabId)],
  });
};

const applyStateForTab = async ({ tab, settings }) => {
  if (!tab || typeof tab.id !== "number") {
    return {
      ok: true,
      state: State.Neutral,
      matchedToken: "",
      reason: "missing-tab",
      url: "",
    };
  }
  const url = tab.url || "";

  if (!settings.isEnabled) {
    await replaceManagedRules([]);
    await updateBadge({
      tabId: tab.id,
      state: State.Neutral,
    });
    return {
      ok: true,
      tabId: tab.id,
      url,
      state: State.Disabled,
      matchedToken: "",
      reason: "disabled",
    };
  }

  const match = getMatchState({
    url,
    blacklist: settings.blacklist,
    whitelist: settings.whitelist,
  });
  if (match.state === State.Blocked) {
    const rule = buildBlockRule(tab.id);
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [rule.id],
      addRules: [rule],
    });
  } else {
    await removeRuleForTab(tab.id);
  }
  await updateBadge({
    tabId: tab.id,
    state: match.state,
  });
  return {
    ok: true,
    tabId: tab.id,
    url,
    ...match,
  };
};

const refreshTabById = async (tabId) => {
  try {
    const [tab, settings] = await Promise.all([chrome.tabs.get(tabId), loadSettings()]);
    return applyStateForTab({
      tab,
      settings,
    });
  } catch (error) {
    await removeRuleForTab(tabId);
    return {
      ok: false,
      state: State.Neutral,
      matchedToken: "",
      reason: "tab-unavailable",
      error: error.message || "Tab is unavailable",
    };
  }
};

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tab || null;
};

const refreshActiveTab = async () => {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== "number") {
    return {
      ok: true,
      state: State.Neutral,
      matchedToken: "",
      reason: "missing-active-tab",
      url: "",
    };
  }
  return refreshTabById(tab.id);
};

const replaceManagedRules = async (rules) => {
  const existingRules = await chrome.declarativeNetRequest.getSessionRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);
  if (!removeRuleIds.length && !rules.length) {
    return;
  }
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds,
    addRules: rules,
  });
};

const refreshAllTabs = async () => {
  const [tabs, settings] = await Promise.all([chrome.tabs.query({}), loadSettings()]);
  const states = [];
  const rules = [];

  if (!settings.isEnabled) {
    await replaceManagedRules([]);
    await Promise.all(
      tabs.map((tab) =>
        updateBadge({
          tabId: tab.id,
          state: State.Neutral,
        }),
      ),
    );
    return {
      ok: true,
      isEnabled: false,
      blockedTabCount: 0,
      checkedTabCount: tabs.length,
    };
  }

  for (const tab of tabs) {
    if (typeof tab.id !== "number") {
      continue;
    }
    const match = getMatchState({
      url: tab.url || "",
      blacklist: settings.blacklist,
      whitelist: settings.whitelist,
    });
    states.push({
      tabId: tab.id,
      ...match,
    });
    if (match.state === State.Blocked) {
      rules.push(buildBlockRule(tab.id));
    }
  }
  await replaceManagedRules(rules);
  await Promise.all(
    states.map((state) =>
      updateBadge({
        tabId: state.tabId,
        state: state.state,
      }),
    ),
  );
  return {
    ok: true,
    blockedTabCount: rules.length,
    checkedTabCount: states.length,
  };
};

const enqueueOperation = (task) => {
  const nextOperation = operationQueue.then(task, task);
  operationQueue = nextOperation.catch((error) => {
    console.error("URL Network Guard operation failed", error);
  });
  return nextOperation;
};

const hasRelevantStorageChange = (changes) =>
  Object.keys(changes || {}).some((key) => RELEVANT_STORAGE_KEYS.has(key));

chrome.runtime.onInstalled.addListener(() => {
  void enqueueOperation(refreshAllTabs);
});

chrome.runtime.onStartup.addListener(() => {
  void enqueueOperation(refreshAllTabs);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "loading" || changeInfo.status === "complete") {
    void enqueueOperation(() => refreshTabById(tabId));
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void enqueueOperation(() => refreshTabById(tabId));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void enqueueOperation(() => removeRuleForTab(tabId));
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  void enqueueOperation(async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      windowId,
    });
    if (tab && typeof tab.id === "number") {
      return refreshTabById(tab.id);
    }
    return {
      ok: true,
      state: State.Neutral,
      reason: "missing-focused-tab",
    };
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && hasRelevantStorageChange(changes)) {
    void enqueueOperation(refreshAllTabs);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }
  const respond = async () => {
    if (message.type === "guard:get-active-state") {
      return enqueueOperation(refreshActiveTab);
    }
    if (message.type === "guard:refresh-active") {
      return enqueueOperation(refreshActiveTab);
    }
    if (message.type === "guard:refresh-all") {
      return enqueueOperation(refreshAllTabs);
    }
    return {
      ok: false,
      error: "Unknown message type",
    };
  };
  respond()
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error("Failed to handle message", error);
      sendResponse({
        ok: false,
        error: error.message || "Failed to handle message",
      });
    });
  return true;
});
