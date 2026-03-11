
import { createRoot } from "react-dom/client";
import Content from "./Content";

const mount = () => {
  const body = document.body;
  if (!body) return false;

  const existingRoot = document.getElementById("sidepanel-root");
  if (existingRoot && existingRoot.parentElement) {
    existingRoot.parentElement.removeChild(existingRoot);
  }

  const root = document.createElement("div");
  root.id = "sidepanel-div";
  body.appendChild(root);
  createRoot(root).render(<Content />);
  return true;
};

if (!mount()) {
  const timer = window.setInterval(() => {
    if (mount()) {
      window.clearInterval(timer);
    }
  }, 50);
}
