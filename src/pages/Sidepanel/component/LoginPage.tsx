import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormText } from "@ant-design/pro-components";
import { FC, useMemo, useState } from "react";
import { Tabs } from "antd";
import { appFontFamily, brandColors } from "../../../theme/yellowTheme";

type AuthTab = "login" | "register";

type AuthResult = { ok: boolean; msg?: string; data?: any };

const LoginPage: FC<{
  onLogin: (username: string, pwd: string, username_ori: string) => Promise<AuthResult>;
  onRegister: (username: string, username_ori: string, password: string) => Promise<AuthResult>;
}> = ({ onLogin, onRegister }) => {
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const appIcon = chrome.runtime.getURL("assets/img/icon-128.png");

  const hashSha256 = async (value: string) => {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const submitEnabled = useMemo(() => {
    return Boolean(username.trim() && password.trim());
  }, [username, password]);

  return (
    <ProConfigProvider hashed={false}>
      <div
        style={{
          background: brandColors.background,
          minHeight: "100vh",
          padding: "9vh 16px 24px",
          display: "flex",
          justifyContent: "center",
          fontFamily: appFontFamily,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <LoginForm
            style={{
              fontFamily: appFontFamily,
              background: brandColors.surface,
              borderRadius: 20,
              padding: "28px 24px 12px",
              boxShadow: brandColors.glow,
              border: `1px solid ${brandColors.border}`,
            }}
            logo={
              <img
                src={appIcon}
                alt="PostRay"
                style={{ width: 54, height: 54, objectFit: "contain" }}
              />
            }
            title={
              <span style={{ color: brandColors.text, letterSpacing: "-0.02em" }}>
                {chrome.i18n.getMessage("appName")}
              </span>
            }
            subTitle={
              <span style={{ color: brandColors.textMuted, fontFamily: appFontFamily }}>
                {chrome.i18n.getMessage("extDesc")}
              </span>
            }
            onFinish={async () => {
              try {
                const usernameHash = await hashSha256(username.trim());
                const pwdHash = await hashSha256(password.trim());

                if (authTab === "login") {
                  const res = await onLogin(usernameHash, pwdHash, username.trim());
                  if (!res?.ok) {
                    window.alert(res?.msg || chrome.i18n.getMessage("loginFailedLabel"));
                    return false;
                  }
                  return true;
                }

                const res = await onRegister(usernameHash, username.trim(), pwdHash);
                if (!res?.ok) {
                  window.alert(res?.msg || chrome.i18n.getMessage("registerFailedLabel"));
                  return false;
                }
                return true;
              } catch (e) {
                window.alert(
                  authTab === "login"
                    ? chrome.i18n.getMessage("loginFailedLabel")
                    : chrome.i18n.getMessage("registerFailedLabel")
                );
                return false;
              }
            }}
            submitter={{
              submitButtonProps: {
                style: {
                  width: "100%",
                  height: 44,
                  fontFamily: appFontFamily,
                  fontWeight: 600,
                },
                disabled: !submitEnabled,
              },
              searchConfig: {
                submitText:
                  authTab === "register"
                    ? chrome.i18n.getMessage("registerButtonLabel")
                    : chrome.i18n.getMessage("loginButtonLabel"),
              },
            }}
          >
            <Tabs
              activeKey={authTab}
              size="large"
              centered
              onChange={(key) => setAuthTab(key as AuthTab)}
              items={[
                {
                  key: "login",
                  label: (
                    <span style={{ fontFamily: appFontFamily, fontSize: 15 }}>
                      {chrome.i18n.getMessage("loginButtonLabel")}
                    </span>
                  ),
                },
                {
                  key: "register",
                  label: (
                    <span style={{ fontFamily: appFontFamily, fontSize: 15 }}>
                      {chrome.i18n.getMessage("registerButtonLabel")}
                    </span>
                  ),
                },
              ]}
            />

            <ProFormText
              required
              name="username"
              fieldProps={{
                size: "large",
                prefix: <UserOutlined className={"prefixIcon"} />,
                value: username,
                onChange: (e) => setUsername(e.target.value),
                style: { fontFamily: appFontFamily },
              }}
              label={
                <span style={{ fontFamily: appFontFamily, color: brandColors.text }}>
                  {chrome.i18n.getMessage("usernameLabel")}
                </span>
              }
              placeholder=""
              allowClear
              rules={[{ required: true, message: chrome.i18n.getMessage("alertNoUserName") }]}
            />

            <div style={{ position: "relative" }}>
              <ProFormText.Password
                name="password"
                label={
                  <span style={{ fontFamily: appFontFamily, color: brandColors.text }}>
                    {chrome.i18n.getMessage("pwdLabel")}
                  </span>
                }
                placeholder=""
                fieldProps={{
                  size: "large",
                  prefix: <LockOutlined className={"prefixIcon"} />,
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  style: { fontFamily: appFontFamily },
                }}
                rules={[
                  {
                    required: true,
                    message: chrome.i18n.getMessage("alertNoPassword"),
                  },
                ]}
              />
              {authTab === "login" && (
                <a
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 0,
                    color: brandColors.primary,
                    fontFamily: appFontFamily,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {chrome.i18n.getMessage("forgetPwdLabel")}
                </a>
              )}
            </div>
          </LoginForm>
        </div>
      </div>
    </ProConfigProvider>
  );
};

export default LoginPage;
