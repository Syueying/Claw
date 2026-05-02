import "../../assets/fonts/fonts.css";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Alert, Button, ConfigProvider, Input, Layout, Tag, Typography } from "antd";
import { CheckOutlined, CloseOutlined, ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";
import { antdYellowTheme, appFontFamily, brandColors } from "../../theme/yellowTheme";
import { LANDING_URL } from "../pageUrls";
import { getProPrice } from "../../utils/price";

const { Content } = Layout;

const SUPABASE_URL = "https://cfhshhogusutbyctcjsn.supabase.co";

type Feature = { label: string; included: boolean };

const FREE_FEATURES: Feature[] = [
  { label: "Latest 50 public posts", included: true },
  { label: "Custom date range", included: false },
];

const PRO_FEATURES: Feature[] = [
  { label: "Custom date range collection", included: true },
  { label: "Unlimited posts per run", included: true },
];

const appIcon = (() => {
  try { return chrome.runtime.getURL("assets/img/icon-128.png"); } catch { return ""; }
})();

const openLanding = () => {
  try { chrome.tabs.update({ url: LANDING_URL }); } catch { window.location.href = LANDING_URL; }
};

const sha256 = async (str: string): Promise<string> => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const PlansApp = () => {
  const params = new URLSearchParams(window.location.search);
  const hashedUsernameFromUrl = params.get("u") || "";
  const isSuccess = params.get("success") === "true";

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const price = getProPrice();

  const startCheckout = async (hashedUsername: string) => {
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const loc = window.location;
      const baseUrl = `${loc.origin}${loc.pathname}`;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: hashedUsername,
          successUrl: `${baseUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: baseUrl,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSubscribeClick = () => {
    if (hashedUsernameFromUrl) {
      startCheckout(hashedUsernameFromUrl);
    } else {
      setShowUsernameForm(true);
    }
  };

  const handleWebCheckout = async () => {
    if (!usernameInput.trim()) return;
    const hash = await sha256(usernameInput.trim().toLowerCase());
    await startCheckout(hash);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: brandColors.background, fontFamily: appFontFamily }}>
      {/* Nav */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${brandColors.border}`,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        height: 56,
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          style={{ color: brandColors.textMuted, fontFamily: appFontFamily, marginRight: "auto" }}
          onClick={openLanding}
        >
          Home
        </Button>
        {appIcon && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={appIcon} alt="" style={{ width: 24, height: 24 }} />
            <Typography.Text style={{ fontFamily: appFontFamily, fontWeight: 800, color: brandColors.text }}>
              PostRay
            </Typography.Text>
          </div>
        )}
      </div>

      <Content style={{ padding: "52px 24px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Success banner */}
        {isSuccess && (
          <div style={{ width: "100%", maxWidth: 700, marginBottom: 32 }}>
            <Alert
              type="success"
              showIcon
              message="Payment successful!"
              description="Your Pro subscription is now active. Open the PostRay extension to start collecting."
              style={{ borderRadius: 12, fontFamily: appFontFamily }}
            />
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <Typography.Title
            level={2}
            style={{ margin: "0 0 10px", color: brandColors.text, fontFamily: appFontFamily, letterSpacing: "-0.03em", fontWeight: 800 }}
          >
            Choose Your Plan
          </Typography.Title>
          <Typography.Text style={{ color: brandColors.textMuted, fontSize: 16, fontFamily: appFontFamily }}>
            Start free. Upgrade when you need more.
          </Typography.Text>
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 700, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>

          {/* Free */}
          <div style={{
            flex: "1 1 280px",
            border: `1px solid ${brandColors.border}`,
            borderRadius: 20,
            padding: "28px 26px",
            background: brandColors.surface,
            boxShadow: brandColors.glow,
          }}>
            <Typography.Text style={{ color: brandColors.textMuted, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: appFontFamily }}>
              Free
            </Typography.Text>
            <div style={{ margin: "14px 0 6px", display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: brandColors.text, fontFamily: appFontFamily }}>$0</span>
              <span style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 14 }}>/month</span>
            </div>
            <Tag style={{
              borderRadius: 999,
              background: brandColors.backgroundSoft,
              border: `1px solid ${brandColors.border}`,
              color: brandColors.textMuted,
              fontFamily: appFontFamily,
              marginBottom: 22,
              fontSize: 12,
              fontWeight: 600,
            }}>
              Current Plan
            </Tag>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontFamily: appFontFamily, color: f.included ? brandColors.text : brandColors.textMuted }}>
                  {f.included
                    ? <CheckOutlined style={{ color: brandColors.primary, fontSize: 13, flexShrink: 0 }} />
                    : <CloseOutlined style={{ color: brandColors.border, fontSize: 12, flexShrink: 0 }} />
                  }
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{
            flex: "1 1 280px",
            border: `2px solid ${brandColors.primary}`,
            borderRadius: 20,
            padding: "28px 26px",
            background: brandColors.surface,
            boxShadow: `0 0 0 4px ${brandColors.backgroundSoft}, ${brandColors.glow}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Typography.Text style={{ color: brandColors.primary, fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: appFontFamily }}>
                Pro
              </Typography.Text>
              <Tag style={{ borderRadius: 999, background: brandColors.primary, border: "none", color: "#fff", fontFamily: appFontFamily, fontWeight: 600, fontSize: 11 }}>
                Recommended
              </Tag>
            </div>

            <div style={{ marginBottom: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: brandColors.text, fontFamily: appFontFamily }}>{price.amount}</span>
              <span style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 14 }}>{price.period}</span>
            </div>
            <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 12, display: "block", marginBottom: 20 }}>
              30-day access · one-time payment
            </Typography.Text>

            <Button
              type="primary"
              block
              loading={checkingOut}
              style={{ height: 44, fontFamily: appFontFamily, fontWeight: 700, marginBottom: 22, borderRadius: 12 }}
              onClick={handleSubscribeClick}
            >
              Subscribe Now
            </Button>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PRO_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontFamily: appFontFamily, color: brandColors.text }}>
                  <CheckOutlined style={{ color: brandColors.primary, fontSize: 13, flexShrink: 0 }} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {checkoutError && (
          <div style={{ width: "100%", maxWidth: 480, marginBottom: 20 }}>
            <Alert type="error" message={checkoutError} showIcon style={{ borderRadius: 12, fontFamily: appFontFamily }} />
          </div>
        )}

        {/* Username form — shown when opening directly from the web (no ?u= param) */}
        {showUsernameForm && !hashedUsernameFromUrl && (
          <div style={{
            width: "100%",
            maxWidth: 480,
            border: `1px solid ${brandColors.border}`,
            borderRadius: 20,
            padding: "36px 32px",
            background: brandColors.surface,
            boxShadow: brandColors.glow,
          }}>
            <Typography.Title level={5} style={{ color: brandColors.text, fontFamily: appFontFamily, margin: "0 0 6px" }}>
              Enter your PostRay username
            </Typography.Title>
            <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 13, display: "block", marginBottom: 20 }}>
              Use the same username you registered with in the extension. Your subscription will be linked to this account.
            </Typography.Text>
            <Input
              size="large"
              prefix={<LockOutlined style={{ color: brandColors.textMuted }} />}
              placeholder="Your PostRay username"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onPressEnter={handleWebCheckout}
              style={{ borderRadius: 10, fontFamily: appFontFamily, marginBottom: 16 }}
            />
            <Button
              type="primary"
              block
              size="large"
              loading={checkingOut}
              disabled={!usernameInput.trim()}
              style={{ height: 44, fontFamily: appFontFamily, fontWeight: 700, borderRadius: 12 }}
              onClick={handleWebCheckout}
            >
              Continue to Payment
            </Button>
            <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 12, display: "block", textAlign: "center", marginTop: 12 }}>
              Payments secured by Stripe
            </Typography.Text>
          </div>
        )}
      </Content>
    </Layout>
  );
};

const rootEl = document.getElementById("plans-root");
if (rootEl) {
  createRoot(rootEl).render(
    <ConfigProvider theme={antdYellowTheme}>
      <PlansApp />
    </ConfigProvider>
  );
}
