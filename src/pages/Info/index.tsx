import '../../assets/fonts/fonts.css';
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ConfigProvider, Layout, Space, Menu, Typography, Input } from "antd";
import ReactMarkdown from "react-markdown";
import { antdYellowTheme, appFontFamily, brandColors } from "../../theme/yellowTheme";

const { Header, Content } = Layout;
const { TextArea } = Input;

type TabKey = "home" | "docs" | "plans";

const STORAGE_KEYS: Record<TabKey, string> = {
  home: "INFO_MD_HOME",
  docs: "INFO_MD_DOCS",
  plans: "INFO_MD_PLANS",
};

const DEFAULT_MD: Record<TabKey, string> = {
  home: `# PostRay\n\n- Collect public Instagram post metadata\n- Export results to Excel\n- Keep recent local collection history\n\nOpen a public Instagram profile, enter the profile ID, and start collecting.`,
  docs: `# Guide\n\n## Quick Start\n1. Open a public Instagram profile page\n2. Enter the profile ID\n3. Select a date range if available\n4. Click Collect Posts\n\n## Tips\n- Keep the tab open during collection\n- Use the viewer for detailed results`,
  plans: `# Plans\n\n- Free: recent 50 public posts\n- Member: custom date range\n\nUse the side panel to manage collections and exports.`,
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
    <Layout style={{ minHeight: "100vh", background: brandColors.background, fontFamily: appFontFamily }}>
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
            style={{ fontSize: 18, fontFamily: appFontFamily, borderRadius: 14, background: brandColors.surface, border: `1px solid ${brandColors.border}`, boxShadow: brandColors.glow, letterSpacing: "0.01em" }}
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
              style={{ fontFamily: appFontFamily, background: brandColors.surface, color: brandColors.text, border: `1px solid ${brandColors.border}` }}
            />
          ) : (
            <div style={{ padding: "16px 18px", fontFamily: appFontFamily, color: brandColors.text, background: brandColors.surface, border: `1px solid ${brandColors.border}`, borderRadius: 16, boxShadow: brandColors.glow }}>
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
