export const onActionButtonClickedListener = () => {
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      // if (!tab?.url || !tab.url.includes('www.instagram.com')) {
      //   return;
      // }

      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
      console.error('Error handling action click:', error);
    }
  });
};