(function () {
  const REQUEST_TIMEOUT_MS = 15000;
  const shouldCapture = (url) => 
    !window.__CLAW_API_INCLUDES__ || (url && url.includes(window.__CLAW_API_INCLUDES__));

  const post = (payload) => {
    window.postMessage({ __claw: true, type: "NET_RESPONSE", payload }, "*");
  };

  const postTimeout = (payload) => {
    window.postMessage({ __claw: true, type: "NET_TIMEOUT", payload }, "*");
  };

  const wrapXHR = () => {
    const OriginalXHR = window.XMLHttpRequest;
    function XHR() {
      const xhr = new OriginalXHR();
      let url = "";
      let timeoutId = null;
      let timedOut = false;
      const open = xhr.open;
      const send = xhr.send;
      xhr.open = function (method, u) {
        url = u;
        return open.apply(xhr, arguments);
      };
      xhr.send = function () {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          try {
            xhr.abort();
          } catch (e) {}
          try {
            alert("当前任务失败，请重试");
          } catch (e) {}
          postTimeout({ url, time: Date.now() });
        }, REQUEST_TIMEOUT_MS);
        return send.apply(xhr, arguments);
      };
      xhr.addEventListener("loadend", function () {
        if (timeoutId != null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          if (!timedOut && shouldCapture(url)) {
            post({ url, text: xhr.responseText, time: Date.now() });
          }
        } catch (e) {}
      });
      return xhr;
    }
    window.XMLHttpRequest = XHR;
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
  };

  wrapXHR();
})();
