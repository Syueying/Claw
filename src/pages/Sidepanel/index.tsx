import React from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import Sidepanel from "./component/Sidepanel";
import { antdYellowTheme } from "../../theme/yellowTheme";

const root = document.createElement("div");
root.id = "sidepanel-ui";
document.body.appendChild(root);

createRoot(root).render(
  <ConfigProvider theme={antdYellowTheme}>
    <Sidepanel />
  </ConfigProvider>
);
