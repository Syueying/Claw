import { onActionButtonClickedListener } from "./onActionButtonClickedListener";
import { onMessageListener } from "./onMessageListener";

export const initializeListeners = () => {
  onActionButtonClickedListener();
  onMessageListener();
};
