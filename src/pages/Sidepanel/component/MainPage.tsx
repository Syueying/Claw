import "../../../assets/fonts/fonts.css";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import { crawlAccountType, HistoryDataType, userDataType } from "../data";
import { Alert, Button, Form, Layout, Space, Spin, Tag, Typography } from "antd";
import { ProForm, ProFormDateRangePicker, ProFormText, ProList } from "@ant-design/pro-components";
import {
  CLEAR_HISTORY,
  COLLECTING_STATE,
  EXPORT_RUN,
  HISTORY,
  HISTORY_REFRESH_TS,
  LATEST_COLLECTED_TRACE,
  START_COLLECTION,
  STOP_COLLECTION,
  USER_PROFILE,
} from "../../consts";
import { sendRuntimeMessage } from "../../../utils/runtime";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { appFontFamily, brandColors } from "../../../theme/yellowTheme";

const { Content } = Layout;

const sectionStyle: CSSProperties = {
  background: brandColors.surface,
  border: `1px solid ${brandColors.border}`,
  borderRadius: 18,
  boxShadow: brandColors.glow,
};

const MainPage: FC<{ onLogout?: () => void | Promise<void> }> = ({ onLogout }) => {
  const [historyData, setHistoryData] = useState<HistoryDataType[]>([]);
  const [userData, setUserData] = useState<userDataType | null>(null);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [isVisitor, setIsVisitor] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [form] = Form.useForm();

  const planLabel = useMemo(
    () => (isVisitor ? chrome.i18n.getMessage("freePlanLabel") : chrome.i18n.getMessage("memberPlanLabel")),
    [isVisitor]
  );

  const onFormFinish = async (formData: {
    accountId: string;
    startTime?: string;
    endTime?: string;
  }) => {
    if (isCollecting) {
      await sendRuntimeMessage({ type: STOP_COLLECTION });
      setIsCollecting(false);
      return;
    }

    const { accountId, startTime, endTime } = formData;
    const startTimeValue = (startTime as unknown as { toISOString?: () => string })?.toISOString?.() ?? startTime;
    const endTimeValue = (endTime as unknown as { toISOString?: () => string })?.toISOString?.() ?? endTime;
    const latestCrawledTime = Date.now();

    await chrome.storage.local.set({
      [LATEST_COLLECTED_TRACE]: JSON.stringify({
        accountId,
        startDate: startTimeValue,
        endDate: endTimeValue,
        runId: latestCrawledTime,
      }),
    });

    await sendRuntimeMessage({
      type: START_COLLECTION,
      payload: {
        runId: latestCrawledTime,
        accountId,
        accountType: userData?.type,
        startTime: isVisitor ? undefined : startTimeValue,
        endTime: isVisitor ? undefined : endTimeValue,
      },
    });
    setIsCollecting(true);
  };

  const loadHistory = async () => {
    const data = await chrome.storage.local.get(HISTORY);
    const storedHistory = (data[HISTORY] || []) as HistoryDataType[];
    setHistoryData(storedHistory);

    const latest = storedHistory.length > 0 ? storedHistory[0] : null;
    if (!latest) return;
    form.setFieldsValue({
      accountId: latest.accountId,
      date: [latest.startTime, latest.endTime],
    });
  };

  const init = async () => {
    setIsInitializing(true);
    try {
      const profileStore = await chrome.storage.local.get(USER_PROFILE);
      const profile = profileStore[USER_PROFILE] as userDataType | undefined;
      if (profile) {
        setUserData(profile);
        setIsVisitor(profile?.type === 0);
      }

      const collectingState = await chrome.storage.local.get(COLLECTING_STATE);
      const stored = collectingState[COLLECTING_STATE] as { isCollecting?: boolean } | undefined;
      if (typeof stored?.isCollecting === "boolean") {
        setIsCollecting(stored.isCollecting);
      }

      const storedHistory = await chrome.storage.local.get(LATEST_COLLECTED_TRACE);
      const latestCollectedAccount = storedHistory[LATEST_COLLECTED_TRACE] as string | undefined;
      if (latestCollectedAccount) {
        try {
          const parsedAccount: crawlAccountType = JSON.parse(latestCollectedAccount);
          form.setFieldsValue({
            accountId: parsedAccount.accountId,
            date: [parsedAccount.startDate, parsedAccount.endDate],
          });
        } catch (e) {}
      }

      await loadHistory();
    } finally {
      setIsInitializing(false);
    }
  };

  const openPreview = async (row: HistoryDataType) => {
    if (!row?.runId) return;
    const url = chrome.runtime.getURL(`viewer.html?runId=${encodeURIComponent(String(row.runId))}`);
    await chrome.tabs.create({ url });
  };

  useEffect(() => {
    init();

    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === STOP_COLLECTION) {
        setIsCollecting(false);
        loadHistory();
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);

    const onStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return;
      if (changes[COLLECTING_STATE]) {
        const next = changes[COLLECTING_STATE].newValue as { isCollecting?: boolean } | undefined;
        if (typeof next?.isCollecting === "boolean") {
          setIsCollecting(next.isCollecting);
        }
      }
      if (changes[HISTORY_REFRESH_TS]) {
        loadHistory();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
      chrome.storage.onChanged.removeListener(onStorageChange);
    };
  }, []);

  if (isInitializing) {
    return (
      <Layout
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: brandColors.background,
        }}
      >
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: brandColors.background }}>
      <Content
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily: appFontFamily,
        }}
      >
        <div
          style={{
            ...sectionStyle,
            padding: "18px 18px 16px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Typography.Text
              style={{
                color: brandColors.primary,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: appFontFamily,
              }}
            >
              {chrome.i18n.getMessage("appName")}
            </Typography.Text>
            <Typography.Title
              level={4}
              style={{
                margin: "6px 0 4px",
                color: brandColors.text,
                fontFamily: appFontFamily,
                letterSpacing: "-0.03em",
              }}
            >
              {chrome.i18n.getMessage("workspaceHeadlineLabel")}
            </Typography.Title>
            <Typography.Paragraph
              style={{
                marginBottom: 10,
                color: brandColors.textMuted,
                fontFamily: appFontFamily,
              }}
            >
              {chrome.i18n.getMessage("extDesc")}
            </Typography.Paragraph>
            <Space size={8} wrap>
              <Tag
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: brandColors.backgroundSoft,
                  border: `1px solid ${brandColors.border}`,
                  color: brandColors.primary,
                  fontFamily: appFontFamily,
                }}
              >
                {chrome.i18n.getMessage("platformLabel")} · {chrome.i18n.getMessage("PlatfromIns")}
              </Tag>
              <Tag
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: brandColors.tag,
                  border: "none",
                  color: brandColors.tagText,
                  fontFamily: appFontFamily,
                }}
              >
                {chrome.i18n.getMessage("planLabel")} · {planLabel}
              </Tag>
            </Space>
          </div>

          <div style={{ textAlign: "right", minWidth: 118 }}>
            <Typography.Text
              style={{
                display: "block",
                color: brandColors.textMuted,
                fontSize: 12,
                marginBottom: 4,
                fontFamily: appFontFamily,
              }}
            >
              {chrome.i18n.getMessage("signedInAsLabel")}
            </Typography.Text>
            <Typography.Text
              strong
              style={{
                display: "block",
                color: brandColors.text,
                marginBottom: 12,
                fontFamily: appFontFamily,
              }}
            >
              {userData?.username || "-"}
            </Typography.Text>
            <Button
              type="default"
              onClick={async () => {
                if (!window.confirm(chrome.i18n.getMessage("logoutConfirmLabel"))) return;
                await onLogout?.();
              }}
            >
              {chrome.i18n.getMessage("logoutButtonLabel")}
            </Button>
          </div>
        </div>

        <div style={{ ...sectionStyle, padding: 18 }}>
          <Typography.Title
            level={5}
            style={{ margin: 0, color: brandColors.text, fontFamily: appFontFamily }}
          >
            {chrome.i18n.getMessage("collectionSetupLabel")}
          </Typography.Title>
          <Typography.Paragraph
            style={{
              marginTop: 6,
              marginBottom: 16,
              color: brandColors.textMuted,
              fontFamily: appFontFamily,
            }}
          >
            {chrome.i18n.getMessage("accountIdFiledPlaceholder")}
          </Typography.Paragraph>

          <ProForm
            form={form}
            initialValues={{}}
            style={{ fontFamily: appFontFamily }}
            size="middle"
            onFinish={onFormFinish}
            layout="vertical"
            submitter={{
              resetButtonProps: { style: { display: "none" } },
              render: (props) => [
                <Button
                  style={{ width: "100%", height: 44, fontFamily: appFontFamily, fontWeight: 700 }}
                  type="primary"
                  key="submit"
                  onClick={() => props.form?.submit?.()}
                >
                  {isCollecting
                    ? chrome.i18n.getMessage("cancelCollectingLabel")
                    : chrome.i18n.getMessage("startCollectingLabel")}
                </Button>,
              ],
            }}
          >
            <ProFormText
              colProps={{ span: 24 }}
              required
              name="accountId"
              width="xl"
              label={
                <span style={{ fontFamily: appFontFamily, color: brandColors.text }}>
                  {chrome.i18n.getMessage("accountIdFiledLabel")}
                </span>
              }
              placeholder=""
              allowClear
              rules={[{ required: true, message: chrome.i18n.getMessage("alertNoAccountId") }]}
              fieldProps={{
                style: { width: "100%", maxWidth: "100%", fontFamily: appFontFamily },
                disabled: isCollecting,
              }}
            />

            {isVisitor && (
              <Alert
                style={{ marginBottom: 16, fontFamily: appFontFamily }}
                description={chrome.i18n.getMessage("freeUserDateHint")}
                type="warning"
                showIcon
              />
            )}

            <ProFormDateRangePicker
              label={
                <span style={{ fontFamily: appFontFamily, color: brandColors.text }}>
                  {chrome.i18n.getMessage("dateLaFieldLabel")}
                </span>
              }
              width="xl"
              fieldProps={{
                style: { marginBottom: 0, width: "100%", maxWidth: "100%", fontFamily: appFontFamily },
                disabled: isCollecting || isVisitor,
                disabledDate: (current) => current && current > dayjs().endOf("day"),
              }}
              transform={(values) => {
                return {
                  startTime: values ? values[0] : undefined,
                  endTime: values ? values[1] : undefined,
                };
              }}
              name="date"
              placeholder={["", ""]}
              rules={isVisitor ? [] : [{ required: true, message: chrome.i18n.getMessage("alertNoDateRange") }]}
            />
          </ProForm>
        </div>

        <div
          style={{
            ...sectionStyle,
            padding: 18,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <Typography.Title
                level={5}
                style={{ margin: 0, color: brandColors.text, fontFamily: appFontFamily }}
              >
                {chrome.i18n.getMessage("historyLabel")}
              </Typography.Title>
              <Typography.Text
                style={{ color: brandColors.textMuted, fontFamily: appFontFamily }}
              >
                {chrome.i18n.getMessage("totalLabel")}: {historyData.length}
              </Typography.Text>
            </div>

            {historyData.length > 0 ? (
              <Button
                type="default"
                onClick={async () => {
                  if (!window.confirm(chrome.i18n.getMessage("clearConfirmLabel"))) return;
                  await sendRuntimeMessage({ type: CLEAR_HISTORY });
                  setHistoryData([]);
                }}
              >
                {chrome.i18n.getMessage("clearLabel")}
              </Button>
            ) : null}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <ProList<HistoryDataType>
              rowKey="id"
              dataSource={historyData}
              showActions="hover"
              onDataSourceChange={setHistoryData}
              locale={{ emptyText: chrome.i18n.getMessage("noDataLabel") }}
              onRow={(record) => ({
                onClick: () => openPreview(record),
                style: { cursor: "pointer" },
                title: chrome.i18n.getMessage("previewLabel"),
              })}
              metas={{
                title: {
                  render: (_dom, row) => {
                    const titleText = `${row.accountId}${row.startTime ? ` · ${row.startTime}` : ""}${row.endTime ? ` → ${row.endTime}` : ""}`;
                    return (
                      <div>
                        <Typography.Text
                          strong
                          style={{
                            fontFamily: appFontFamily,
                            fontSize: 15,
                            color: brandColors.text,
                          }}
                        >
                          {titleText}
                        </Typography.Text>
                      </div>
                    );
                  },
                },
                description: {
                  render: (_dom, row) => {
                    const ms = row.runId < 1e12 ? row.runId * 1000 : row.runId;
                    const localTime = new Date(ms).toLocaleString();
                    return (
                      <Space size={8} wrap>
                        <Tag
                          style={{
                            borderRadius: 999,
                            background: brandColors.backgroundSoft,
                            border: `1px solid ${brandColors.border}`,
                            color: brandColors.primary,
                            fontFamily: appFontFamily,
                          }}
                        >
                          {chrome.i18n.getMessage("PlatfromIns")}
                        </Tag>
                        <Typography.Text
                          style={{ fontSize: 13, color: brandColors.textMuted, fontFamily: appFontFamily }}
                        >
                          {localTime}
                        </Typography.Text>
                      </Space>
                    );
                  },
                },
                actions: {
                  render: (_dom, row) => [
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={async (event) => {
                        event?.stopPropagation?.();
                        if (!row?.runId) return;
                        await sendRuntimeMessage({
                          type: EXPORT_RUN,
                          payload: { runId: row.runId },
                        });
                      }}
                    >
                      {chrome.i18n.getMessage("exportLabel")}
                    </Button>,
                  ],
                },
              }}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default MainPage;
