import '../../assets/fonts/fonts.css';
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ConfigProvider, Layout, Space, Menu, Typography, Input } from "antd";
import ReactMarkdown from "react-markdown";
import { antdYellowTheme, brandColors } from "../../theme/yellowTheme";

const { Header, Content } = Layout;
const { TextArea } = Input;

type TabKey = "home" | "docs" | "plans";

const STORAGE_KEYS: Record<TabKey, string> = {
  home: "INFO_MD_HOME",
  docs: "INFO_MD_DOCS",
  plans: "INFO_MD_PLANS",
};

const DEFAULT_MD: Record<TabKey, string> = {
  home: `# Claw\n\n- Fast capture of Instagram posts\n- Export to Excel\n- Timeline filters (members)\n\n**Start** by entering an Account ID and clicking Start.`,
  docs: `# Docs\n\n## Quick Start\n1. Open Instagram account page\n2. Enter Account ID\n3. Select date range (members)\n4. Click Start\n\n## Tips\n- Keep the tab open\n- Use Preview for details`,
  plans: `# Plans\n\n- Free: latest 100 posts\n- Member: full date range\n\nContact us for team plans.`,
};

const InfoApp = () => {
  const [tab, setTab] = useState<TabKey>("home");
  const [markdown, setMarkdown] = useState<Record<TabKey, string>>(DEFAULT_MD);
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const data = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
      const next: Record<TabKey, string> = { ...DEFAULT_MD };
      (Object.keys(STORAGE_KEYS) as TabKey[]).forEach((key) => {
        const stored = data[STORAGE_KEYS[key]];
        if (typeof stored === "string" && stored.trim()) {
          next[key] = stored;
        }
      });
      setMarkdown(next);
    };
    load();
  }, []);

  const currentMd = markdown[tab] || "";

  const saveCurrent = async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS[tab]]: currentMd });
    setEditing(false);
  };

  const resetCurrent = async () => {
    const next = { ...markdown, [tab]: DEFAULT_MD[tab] };
    setMarkdown(next);
    await chrome.storage.local.set({ [STORAGE_KEYS[tab]]: DEFAULT_MD[tab] });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: brandColors.background, fontFamily: '"Courier New", monospace' }}>
      <Content style={{ padding: 10, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "90%", maxWidth: 960 }}>
          <Menu
            mode="horizontal"
            selectedKeys={[tab]}
            onClick={(e) => {
              setTab(e.key as TabKey);
              setEditing(false);
            }}
            items={[
              { key: "home", label: chrome.i18n.getMessage("navHomeLabel") },
              { key: "docs", label: chrome.i18n.getMessage("navDocsLabel") },
              { key: "plans", label: chrome.i18n.getMessage("navPlansLabel") },
            ]}
            style={{ fontSize: 20, fontFamily: '"Courier New", monospace', borderRadius: '4px', background: brandColors.surface, border: `2px solid ${brandColors.border}`, boxShadow: brandColors.glow, letterSpacing: "0.04em" }}
          />

          <Space style={{ margin: "12px 0" }}>
            <Button type="primary" onClick={() => setEditing(!editing)}>
              {editing ? chrome.i18n.getMessage("previewLabel") : chrome.i18n.getMessage("editLabel")}
            </Button>
            <Button onClick={saveCurrent}>{chrome.i18n.getMessage("saveLabel")}</Button>
            <Button onClick={resetCurrent}>{chrome.i18n.getMessage("resetLabel")}</Button>
          </Space>

          {editing ? (
            <TextArea
              value={currentMd}
              onChange={(e) => setMarkdown({ ...markdown, [tab]: e.target.value })}
              rows={16}
              style={{ fontFamily: '"Courier New", monospace', background: brandColors.surface, color: "#3b2b00", border: `2px solid ${brandColors.border}` }}
            />
          ) : (
            <div style={{ padding: "16px 18px", fontFamily: '"Courier New", monospace', color: "#3b2b00", background: brandColors.surface, border: `2px solid ${brandColors.border}`, borderRadius: 4, boxShadow: brandColors.glow }}>
              <ReactMarkdown>{currentMd}</ReactMarkdown>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

const rootEl = document.getElementById("info-root");
if (rootEl) {
  createRoot(rootEl).render(
    <ConfigProvider theme={antdYellowTheme}>
      <InfoApp />
    </ConfigProvider>
  );
}
