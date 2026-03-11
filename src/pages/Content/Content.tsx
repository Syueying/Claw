import { NET_RESPONSE, NET_TIMEOUT, START_HOOK, START_SCROLL, STOP_COLLECTION, STOP_HOOK } from "../consts";
import { sendRuntimeMessage } from "../../utils/runtime";

const Content = () => {
  return (
    <></>
  );
};

export default Content;

let scrollTimer: number | null = null;
let hookInjected = false;

const stopScroll = () => {
  if (scrollTimer != null) {
    window.clearTimeout(scrollTimer);
    scrollTimer = null;
  }
};

const startScroll = () => {
  if (scrollTimer != null) return;
  scrollTimer = window.setTimeout(() => {
    scrollTimer = null;
    const doc = document.documentElement;
    const target = doc ? doc.scrollHeight : window.innerHeight;
    window.scrollTo({ top: target, left: 0, behavior: "smooth" });
  }, 300);
};

const injectHook = (apiUrlIncludes?: string) => {
  if (hookInjected) return;
  hookInjected = true;
  (window as any).__CLAW_API_INCLUDES__ = apiUrlIncludes || "";

  const parent = document.documentElement || document.head || document.body;
  if (!parent) return;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = chrome.runtime.getURL("contentHook.js");
  parent.appendChild(script);
  script.onload = () => script.remove();
};

if (document.documentElement || document.head || document.body) {
  injectHook("");
} else {
  window.addEventListener("DOMContentLoaded", () => injectHook(""), { once: true });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === START_HOOK) {
    (window as any).__CLAW_API_INCLUDES__ = msg.payload?.apiUrlIncludes || "";
    window.postMessage({ __claw: true, type: START_HOOK }, "*");
    return;
  }

  if (msg?.type === STOP_COLLECTION) {
    stopScroll();
    window.postMessage({ __claw: true, type: STOP_HOOK }, "*");
    return;
  }

  if (msg?.type === START_SCROLL) {
    startScroll();
    return;
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.__claw !== true) return;
  if (data.type === NET_RESPONSE) {
    sendRuntimeMessage({ type: NET_RESPONSE, payload: data.payload });
    return;
  }
  if (data.type === NET_TIMEOUT) {
    sendRuntimeMessage({ type: NET_TIMEOUT, payload: data.payload });
    return;
  }
});
