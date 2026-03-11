export const sendRuntimeMessage = <T = any>(message: any): Promise<T> => {
  return chrome.runtime.sendMessage(message) as Promise<T>;
};
