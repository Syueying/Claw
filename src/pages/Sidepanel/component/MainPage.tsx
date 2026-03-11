import '../../../assets/fonts/fonts.css';
import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { crawlAccountType, HistoryDataType, userDataType } from '../data';
import { Alert, Button, Col, Divider, Form, Layout, Row, Space, Spin, Tag } from 'antd';
import { ProForm, ProFormDateRangePicker, ProFormText, ProList } from '@ant-design/pro-components';
import { CLEAR_HISTORY, COLLECTING_STATE, EXPORT_RUN, HISTORY, HISTORY_REFRESH_TS, LATEST_COLLECTED_TRACE, START_COLLECTION, STOP_COLLECTION, USER_PROFILE } from '../../consts';
import { sendRuntimeMessage } from "../../../utils/runtime";
import { DownloadOutlined, InstagramOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { brandColors } from "../../../theme/yellowTheme";

const { Header, Footer, Content } = Layout;

const MainPage: FC<{ onLogout?: () => void | Promise<void> }> = ({ onLogout }) => {
    const [historyData, setHistoryData] = useState<HistoryDataType[]>([])
    const [userData, setUserData] = useState<userDataType | null>(null);
    const [collectAccount, setCollectAccount] = useState<crawlAccountType | null>(null);
    const [isCollecting, setIsCollecting] = useState<boolean>(false);
    const [isVisitor, setIsVisitor] = useState<boolean>(true);
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const [form] = Form.useForm();

    const onFormFinish = async (formData: {
        accountId: string;
        startTime?: string;
        endTime?: string;
    }) => {

        if (isCollecting) {
            await sendRuntimeMessage({
                type: STOP_COLLECTION
            })
            setIsCollecting(false)
            return 
        }

        const { accountId, startTime, endTime } = formData;
        const startTimeValue = (startTime as unknown as { toISOString?: () => string })?.toISOString?.() ?? startTime;
        const endTimeValue = (endTime as unknown as { toISOString?: () => string })?.toISOString?.() ?? endTime;
        const latestCrawledTime = new Date().getTime();
        
        chrome.storage.local.set({ [LATEST_COLLECTED_TRACE]: JSON.stringify({
            accountId,
            startDate: startTimeValue,
            endDate: endTimeValue,
            runId: latestCrawledTime
        })});

        await sendRuntimeMessage({
            type: START_COLLECTION,
            payload: {
                runId: latestCrawledTime,
                accountId: accountId,
                accountType: userData?.type,
                startTime: isVisitor ? undefined : startTimeValue,
                endTime: isVisitor ? undefined : endTimeValue
            }
        })
        setIsCollecting(true)
        return
    }

    const init = async () => {
        setIsInitializing(true);
        try {
            // 1. 配置用户名/用户类型
            const profileStore = await chrome.storage.local.get(USER_PROFILE);
            const profile = profileStore[USER_PROFILE] as userDataType | undefined;
            if (profile) {
                setUserData(profile);
                setIsVisitor(profile?.type == 0);
            }

            // 2. 配置当前任务状态
            const collectingState = await chrome.storage.local.get(COLLECTING_STATE);
            const stored = collectingState[COLLECTING_STATE] as { isCollecting?: boolean } | undefined;
            const isRunning = stored?.isCollecting;
            if (typeof isRunning === "boolean") {
                setIsCollecting(isRunning);
            }

            // 3. 自动填入最近一次收集的账号记录
            const storedHistory = await chrome.storage.local.get(LATEST_COLLECTED_TRACE);
            const latestCollectedAccount = storedHistory[LATEST_COLLECTED_TRACE] as string | undefined;
            if (latestCollectedAccount) {
                try {
                    const parsedAccount: crawlAccountType = JSON.parse(latestCollectedAccount);
                    setCollectAccount(parsedAccount);

                    form.setFieldsValue({
                        accountId: parsedAccount.accountId,
                        date: [parsedAccount.startDate, parsedAccount.endDate],
                    });
                } catch (e) {
                    // ignore invalid cache
                }
            }

            // 4. 加载最近三次历史数据
            await loadHistory()
        } finally {
            setIsInitializing(false);
        }
    }

    const loadHistory = async () => {
        const data = await chrome.storage.local.get(HISTORY);
        const storedHistory = (data[HISTORY] || []) as HistoryDataType[];
        setHistoryData(storedHistory);
        
        const latest = storedHistory && storedHistory.length > 0 ? storedHistory[0] : null;
        if (!latest) return;
        form.setFieldsValue({
            accountId: latest.accountId,
            date: [latest.startTime, latest.endTime],
        });
    }

    const openPreview = async (row: HistoryDataType) => {
        if (!row?.runId) return;
        const url = chrome.runtime.getURL(`viewer.html?runId=${encodeURIComponent(String(row.runId))}`);
        await chrome.tabs.create({ url });
    }

    const openDocs = async () => {
        const url = chrome.runtime.getURL("info.html");
        await chrome.tabs.create({ url });
    }

    useEffect(() => {
        init()

        // 抓取时，页面关闭则关闭任务，sidepanel关闭不影响任务
        const onMessage = (msg: { type?: string }) => {
            if (msg?.type === STOP_COLLECTION) {
                setIsCollecting(false)
                loadHistory()
            }
        }
        chrome.runtime.onMessage.addListener(onMessage)

        const onStorageChange = (
            changes: { [key: string]: chrome.storage.StorageChange },
            areaName: string
        ) => {
            if (areaName !== "local") return
            if (changes[COLLECTING_STATE]) {
                const next = changes[COLLECTING_STATE].newValue as { isCollecting?: boolean } | undefined
                if (typeof next?.isCollecting === "boolean") {
                    setIsCollecting(next.isCollecting)
                }
            }
            if (changes[HISTORY_REFRESH_TS]) {
                loadHistory()
            }
        }
        chrome.storage.onChanged.addListener(onStorageChange)
        
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage)
            chrome.storage.onChanged.removeListener(onStorageChange)
        }
    }, [])

    if (isInitializing) {
        return (
            <Layout style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: brandColors.background }}>
                <Spin size="large" />
            </Layout>
        );
    }

    return (
        <Layout style={{
            borderRadius: 8,
            overflow: "hidden",
            width: "100vw",
            height: "100vh",
            backgroundColor: brandColors.background
        }}>
            <Header style={{
                alignContent: 'center',
                fontSize: '18px',
                backgroundColor: brandColors.surface,
                width: '98vw',
                height: '7vh',
                borderRadius: '8px',
                lineHeight: '0',
                margin: '10px',
                padding: '0px 50px 0 20px',
                border: `1px solid ${brandColors.border}`,
                boxShadow: brandColors.glow
            }}>
                <Row align="middle" justify="space-between">
                    <Col span={20} style={{fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#3b2b00', letterSpacing: '0.04em'}}>
                        Hi {userData?.username}! 👋
                    </Col>
                    <Col span={4}>
                        <Space>
                            {/* <Button type="primary" onClick={openDocs}>
                                {chrome.i18n.getMessage("docsEntryLabel")}
                            </Button> */}
                            <Button
                                type="primary"
                                onClick={async () => {
                                    if (!window.confirm(chrome.i18n.getMessage("logoutConfirmLabel"))) return;
                                    await onLogout?.();
                                }}
                            >
                                {chrome.i18n.getMessage("logoutButtonLabel")}
                            </Button>
                        </Space>
                    </Col>
                </Row>  
            </Header>

            <Content style={{
                margin: '10px',
                padding: '15x 10px',
                height: '50vh',
                width: '98vw',
                borderRadius: '8px',
                backgroundColor: brandColors.surface,
                border: `1px solid ${brandColors.border}`,
                boxShadow: brandColors.glow
            }}>
                <ProForm
                    form={form}
                    initialValues={{}}
                    style={{
                        padding: '20px',
                        borderRadius: '8px',
                        height:  isVisitor ? '42vh' : '32vh',
                        fontFamily: '"Courier New", monospace'
                    }}
                    size='middle'
                    onFinish={onFormFinish}
                    layout='vertical'
                    submitter={{ 
                        resetButtonProps: {
                            style: {
                                display: 'none',
                            },
                        },
                        submitButtonProps: {},
                        render: (props, _) => [, 
                            <Button style={{ width: '100%' }} type="primary" key="submit" size="large" onClick={() => props.form?.submit?.()}>
                                {isCollecting
                                    ? `⏹ ${chrome.i18n.getMessage("cancelCollectingLabel")}`
                                    : `🚀 ${chrome.i18n.getMessage("startCollectingLabel")}`}
                            </Button>]
                    }}
                >
                    <ProFormText
                        colProps={{ span: 24 }}
                        required
                        name="accountId"
                        width="xl"
                        label={<p style={{ fontFamily: '"Courier New", monospace', marginBottom: 0, fontSize: '16px', letterSpacing: '0.04em' }}>{chrome.i18n.getMessage("accountIdFiledLabel")}</p>}
                        placeholder={""}
                        allowClear
                        rules={[{ required: true, message: chrome.i18n.getMessage("alertNoAccountId") }]}
                        fieldProps={{ style: { marginBottom: 0, width: "100%", maxWidth: "100%" }, disabled: isCollecting }}
                    />

                    {isVisitor && (
                        <Alert
                            style={{ fontFamily: '"Courier New", monospace' }}
                            description={chrome.i18n.getMessage("freeUserDateHint")}
                            type="warning"
                        />
                    )}

                    <ProFormDateRangePicker
                        label={<p style={{ fontFamily: '"Courier New", monospace', marginBottom: 0, fontSize: '16px', letterSpacing: '0.04em' }}>{chrome.i18n.getMessage("dateLaFieldLabel")}</p>}
                        width="xl"
                        fieldProps={{
                            style: { fontFamily: "SNPro-Light", marginBottom: 0, width: "100%", maxWidth: "100%" },
                            disabled: isCollecting || isVisitor,
                            disabledDate: (current) => current && current > dayjs().endOf('day'),
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

                <Divider
                    style={{
                        marginTop: 24,
                        marginBottom: 16,
                        color: brandColors.accent,
                        borderColor: brandColors.border,
                        fontFamily: '"Courier New", monospace',
                        fontSize: '15px',
                        letterSpacing: '0.05em'
                    }}
                >
                    🗂 {chrome.i18n.getMessage("historyLabel")}
                </Divider>
                
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
                    toolBarRender={() => {
                        if (!historyData || historyData.length === 0) {
                            return [];
                        }
                        return [
                            <Button
                                key="clearHistory"
                                size='small'
                                type="default"
                                style={{
                                    border: `2px solid ${brandColors.border}`,
                                    borderRadius: 4,
                                    background: brandColors.surfaceStrong,
                                    color: brandColors.accent,
                                    fontFamily: '"Courier New", monospace',
                                    boxShadow: brandColors.glow
                                }}
                                onClick={async () => {
                                    if (!window.confirm(chrome.i18n.getMessage("clearConfirmLabel"))) {
                                        return
                                    }
                                    await sendRuntimeMessage({ type: CLEAR_HISTORY })
                                    setHistoryData([])
                                }}
                            >
                                🧹 {chrome.i18n.getMessage("clearLabel")}
                            </Button>
                        ];
                    }}
                    metas={{
                        title: {
                            render: (_dom, row) => {
                                const titleText = `${row.accountId}${row.startTime ? `_${row.startTime}` : ""}${row.endTime ? `_${row.endTime}` : ""}`;
                                return (
                                <p
                                    style={{ fontFamily: '"Courier New", monospace', fontSize: "16px", minWidth:"max-content", marginBottom: '0', color: "#3b2b00", letterSpacing: '0.03em' }}
                                >
                                    <Tag color="magenta"><InstagramOutlined style={{marginRight: '5px'}}/>Ins</Tag>
                                    {titleText}
                                </p>
                                );
                            }
                        },
                        subTitle: {
                            render: (_dom, row) => {
                                return (
                                    <></>
                                );
                            },
                        },
                        description: {
                            render: (_dom, row) => {
                                const ms = row.runId < 1e12 ? row.runId * 1000 : row.runId;
                                const localTime = new Date(ms).toLocaleString();
                                return <div style={{ fontSize: '13px', fontFamily: '"Courier New", monospace', color: brandColors.textMuted }}>
                                    {/* {row.startTime ? `${row.startTime} - ${row.endTime}` : ''} */}
                                    {localTime}
                                </div>
                            },
                        },
                        actions: {
                            render: (_dom, row) => [
                                <Button type='text' size="small" icon={<DownloadOutlined />}
                                    onClick={async (event) => {
                                        event?.stopPropagation?.();
                                        if (!row?.runId) return;
                                        await sendRuntimeMessage({
                                            type: EXPORT_RUN,
                                            payload: { runId: row.runId }
                                        });
                                    }}/>
                            ],
                        },
                    }}
                />
            </Content>

            <Footer style={{
                textAlign: 'center',
                backgroundColor: 'transparent',
                width: '98vw',
                fontFamily: '"Courier New", monospace',
                color: brandColors.textMuted,
                padding: '10px 50px',
            }}>
                @Claw
            </Footer>
        </Layout>
    );
}

export default MainPage;
