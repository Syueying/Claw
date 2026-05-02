import "../../assets/fonts/fonts.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { Button, ConfigProvider, Layout, Typography } from "antd";
import { antdYellowTheme, appFontFamily, brandColors } from "../../theme/yellowTheme";
import { CWS_URL, PLANS_URL } from "../pageUrls";

const { Content } = Layout;

const appIcon = (() => {
  try { return chrome.runtime.getURL("assets/img/icon-128.png"); } catch { return ""; }
})();

const openUrl = (url: string) => {
  try { chrome.tabs.create({ url }); } catch { window.open(url, "_blank"); }
};

const FEATURES = [
  {
    icon: "📋",
    title: "Collect Public Post Data",
    desc: "Gather captions, likes, comments, and timestamps from any public Instagram profile — no login required.",
  },
  {
    icon: "📅",
    title: "Custom Date Ranges",
    desc: "Filter posts by exact date range to find what you need. Pro plan unlocks full date range access.",
  },
  {
    icon: "📊",
    title: "Export to Excel",
    desc: "Download results as an Excel file instantly, ready for analysis in any spreadsheet app.",
  },
];

const STEPS = [
  { step: "1", title: "Open Instagram", desc: "Navigate to any public Instagram profile in your Chrome browser." },
  { step: "2", title: "Enter Profile ID", desc: "Open PostRay and enter the Instagram username you want to collect." },
  { step: "3", title: "Collect & Export", desc: "Click Collect Posts, then download your Excel file." },
];

const LandingApp = () => (
  <Layout style={{ minHeight: "100vh", background: brandColors.background, fontFamily: appFontFamily }}>

    {/* Nav */}
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${brandColors.border}`,
      padding: "0 40px",
      display: "flex",
      alignItems: "center",
      height: 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
        {appIcon && <img src={appIcon} alt="" style={{ width: 28, height: 28 }} />}
        <Typography.Text style={{ fontFamily: appFontFamily, fontWeight: 800, color: brandColors.text, fontSize: 16 }}>
          PostRay
        </Typography.Text>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button type="text" style={{ fontFamily: appFontFamily, color: brandColors.textMuted }} onClick={() => openUrl(PLANS_URL)}>
          Plans
        </Button>
        <Button type="primary" style={{ fontFamily: appFontFamily, fontWeight: 600 }} onClick={() => openUrl(CWS_URL)}>
          Install Free
        </Button>
      </div>
    </div>

    <Content>
      {/* Hero */}
      <section style={{
        padding: "88px 40px 80px",
        textAlign: "center",
        background: `linear-gradient(180deg, ${brandColors.backgroundSoft} 0%, ${brandColors.background} 100%)`,
        borderBottom: `1px solid ${brandColors.border}`,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {appIcon && <img src={appIcon} alt="PostRay" style={{ width: 76, height: 76, marginBottom: 24 }} />}
          <Typography.Title
            level={1}
            style={{
              margin: "0 0 18px",
              color: brandColors.text,
              fontFamily: appFontFamily,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              fontSize: "clamp(36px, 5vw, 52px)",
              lineHeight: 1.1,
            }}
          >
            Instagram Post Data,<br />Collected Instantly
          </Typography.Title>
          <Typography.Text style={{
            display: "block",
            color: brandColors.textMuted,
            fontSize: 18,
            fontFamily: appFontFamily,
            lineHeight: 1.65,
            marginBottom: 40,
          }}>
            Extract captions, likes, comments, and timestamps<br />
            from any public Instagram profile. Export to Excel in seconds.
          </Typography.Text>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              type="primary"
              size="large"
              style={{ height: 50, padding: "0 32px", fontFamily: appFontFamily, fontWeight: 700, fontSize: 15, borderRadius: 14 }}
              onClick={() => openUrl(CWS_URL)}
            >
              Install Free →
            </Button>
            <Button
              size="large"
              style={{ height: 50, padding: "0 28px", fontFamily: appFontFamily, fontWeight: 600, fontSize: 15, borderRadius: 14 }}
              onClick={() => openUrl(PLANS_URL)}
            >
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 40px", maxWidth: 1000, margin: "0 auto" }}>
        <Typography.Title
          level={3}
          style={{ textAlign: "center", margin: "0 0 48px", color: brandColors.text, fontFamily: appFontFamily, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Everything you need to analyze Instagram
        </Typography.Title>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: brandColors.surface,
              border: `1px solid ${brandColors.border}`,
              borderRadius: 20,
              padding: "28px 26px",
              boxShadow: brandColors.glow,
            }}>
              <div style={{ fontSize: 30, marginBottom: 16 }}>{f.icon}</div>
              <Typography.Title level={5} style={{ margin: "0 0 8px", color: brandColors.text, fontFamily: appFontFamily, fontWeight: 700 }}>
                {f.title}
              </Typography.Title>
              <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 14, lineHeight: 1.65 }}>
                {f.desc}
              </Typography.Text>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        background: brandColors.backgroundSoft,
        borderTop: `1px solid ${brandColors.border}`,
        borderBottom: `1px solid ${brandColors.border}`,
        padding: "80px 40px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Typography.Title
            level={3}
            style={{ textAlign: "center", margin: "0 0 52px", color: brandColors.text, fontFamily: appFontFamily, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            How it works
          </Typography.Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, textAlign: "center" }}>
            {STEPS.map((s, i) => (
              <div key={i}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: brandColors.primary,
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  fontFamily: appFontFamily,
                }}>
                  {s.step}
                </div>
                <Typography.Title level={5} style={{ margin: "0 0 8px", color: brandColors.text, fontFamily: appFontFamily, fontWeight: 700 }}>
                  {s.title}
                </Typography.Title>
                <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 14, lineHeight: 1.65 }}>
                  {s.desc}
                </Typography.Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans CTA */}
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Typography.Title
            level={3}
            style={{ margin: "0 0 14px", color: brandColors.text, fontFamily: appFontFamily, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Start free. Upgrade when you need more.
          </Typography.Title>
          <Typography.Text style={{
            color: brandColors.textMuted,
            fontFamily: appFontFamily,
            fontSize: 15,
            display: "block",
            marginBottom: 32,
            lineHeight: 1.65,
          }}>
            Free plan includes the latest 50 posts.<br />
            Pro unlocks custom date ranges and unlimited collection.
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            style={{ height: 50, padding: "0 36px", fontFamily: appFontFamily, fontWeight: 700, fontSize: 15, borderRadius: 14 }}
            onClick={() => openUrl(PLANS_URL)}
          >
            View Plans →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${brandColors.border}`,
        padding: "24px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        background: brandColors.surface,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {appIcon && <img src={appIcon} alt="" style={{ width: 20, height: 20 }} />}
          <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 13, fontWeight: 700 }}>
            PostRay
          </Typography.Text>
        </div>
        <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 13 }}>
          Chrome Extension · Instagram Public Post Collector
        </Typography.Text>
      </div>
    </Content>
  </Layout>
);

const rootEl = document.getElementById("landing-root");
if (rootEl) {
  createRoot(rootEl).render(
    <ConfigProvider theme={antdYellowTheme}>
      <LandingApp />
    </ConfigProvider>
  );
}
