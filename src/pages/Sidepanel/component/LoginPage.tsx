import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormText } from "@ant-design/pro-components";
import { FC, useMemo, useState } from "react";
import { Tabs } from "antd";
import { brandColors } from "../../../theme/yellowTheme";

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
    if (!username.trim() || !password.trim()) return false;
    return true;
  }, [authTab, username, password]);

  return (
    <ProConfigProvider hashed={false}>
      <div
        style={{
          backgroundColor: brandColors.background,
          minHeight: "100vh",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-5%)",
        }}
      >
        <LoginForm
          style={{
            fontFamily: "\"Courier New\", monospace",
            background: brandColors.surface,
            borderRadius: 6,
            padding: "20px 20px 8px",
            boxShadow: brandColors.glow,
            border: `2px solid ${brandColors.border}`
          }}
          logo={
            <img
              src={appIcon}
              alt="Claw"
              style={{ width: 48, height: 48, objectFit: "contain", imageRendering: "pixelated" }}
            />
          }
          title={chrome.i18n.getMessage("appName")}
          subTitle={chrome.i18n.getMessage("extDesc")}
          onFinish={async () => {
            try {
              const usernameHash = await hashSha256(username.trim());
              const pwdHash = await hashSha256(password.trim());

              if (authTab == "login") {
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
              style: { width: "100%" },
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
            onChange={(key) => {
              setAuthTab(key as AuthTab);
            }}
            items={[
              { 
                key: "login", 
                label: <p style={{ fontFamily: "\"Courier New\", monospace", marginBottom: 0, fontSize: "16px", letterSpacing: "0.06em" }}>
                        🔐 {chrome.i18n.getMessage("loginButtonLabel")}
                      </p>
              },
              { 
                key: "register", 
                label: <p style={{ fontFamily: "\"Courier New\", monospace", marginBottom: 0, fontSize: "16px", letterSpacing: "0.06em" }}>
                        ✨ {chrome.i18n.getMessage("registerButtonLabel")}
                      </p>
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
            }}
            label={
              <p style={{ fontFamily: "\"Courier New\", monospace", marginBottom: 0, fontSize: "16px", letterSpacing: "0.04em" }}>
                {chrome.i18n.getMessage("usernameLabel")}
              </p>
            }
            placeholder={""}
            allowClear
            rules={[{ required: true, message: chrome.i18n.getMessage("alertNoUserName") }]}
          />

          <ProFormText.Password
            name="password"
            label={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <p style={{ fontFamily: "\"Courier New\", monospace", marginBottom: 0, fontSize: "16px", letterSpacing: "0.04em" }}>
                  {chrome.i18n.getMessage("pwdLabel")}
                </p>
                {authTab === "login" ? (
                  <a style={{ color: brandColors.primaryActive, fontFamily: "\"Courier New\", monospace", marginLeft: "70%", minWidth: "max-content" }}>
                    {chrome.i18n.getMessage("forgetPwdLabel")}
                  </a>
                ) : null}
              </div>
            }
            placeholder={""}
            fieldProps={{
              size: "large",
              prefix: <LockOutlined className={"prefixIcon"} />,
              value: password,
              onChange: (e) => setPassword(e.target.value),
            }}
            rules={[
              {
                required: true,
                message: chrome.i18n.getMessage("alertNoPassword"),
              },
            ]}
          />
        </LoginForm>

        {/* <Button
          type="primary"
          style={{ marginTop: 12, width: "100%" }}
          onClick={async () => {
            const url = chrome.runtime.getURL("info.html");
            await chrome.tabs.create({ url });
          }}
        >
          {chrome.i18n.getMessage("docsEntryLabel")}
        </Button>

        <Divider>{chrome.i18n.getMessage("OrLabel")}</Divider>

        <Button
          style={{ margin: "16px auto", width: "100%", maxWidth: 360, display: "block" }}
          size="large"
          key="google-login"
          onClick={() => alert("Continue with google")}
        >
          <GoogleCircleFilled style={{ paddingRight: "5px" }} />
          {chrome.i18n.getMessage("GoogleLoginLabel")}
        </Button> */}
      </div>
    </ProConfigProvider>
  );
};

export default LoginPage;
