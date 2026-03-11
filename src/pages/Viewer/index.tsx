import '../../assets/fonts/fonts.css';
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ConfigProvider, Input, Layout, Space, Table, Typography } from "antd";
import { EXPORT_RUN, HISTORY } from "../consts";
import { sendRuntimeMessage } from "../../utils/runtime";
import { antdYellowTheme, brandColors } from "../../theme/yellowTheme";

type RecordRow = Record<string, any> & { id?: number };
type HistoryRow = {
  runId: number;
  accountId: string;
  startTime: string;
  endTime: string;
};

const DB_NAME = "claw-crawls";
const RUN_STORE_PREFIX = "run_";

const getRunStoreName = (runId: number | string) => `${RUN_STORE_PREFIX}${runId}`;

const openDb = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const fetchRunRecords = async (runId: number | string) => {
  const db = await openDb();
  return new Promise<RecordRow[]>((resolve, reject) => {
    const storeName = getRunStoreName(runId);
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      resolve([]);
      return;
    }
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result || []) as RecordRow[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const fetchHistoryRow = async (runId: string) => {
  const data = await chrome.storage.local.get(HISTORY);
  const list = (data[HISTORY] || []) as HistoryRow[];
  return list.find((item) => String(item.runId) === String(runId)) || null;
};

const formatRunTime = (runId: string) => {
  const num = Number(runId);
  if (!Number.isFinite(num)) return runId;
  const ms = num < 1e12 ? num * 1000 : num;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const ViewerApp = () => {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [runId, setRunId] = useState<string>("");
  const [meta, setMeta] = useState<HistoryRow | null>(null);
  const [query, setQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(50);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("runId") || "";
    setRunId(id);
    if (!id) return;
    setLoading(true);
    Promise.all([fetchRunRecords(id), fetchHistoryRow(id)])
      .then(([records, historyRow]) => {
        const cleaned = records.map((r) => {
          const { runId: _runId, ...rest } = r;
          return rest;
        });
        setRows(cleaned);
        setMeta(historyRow);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    if (!query) return rows;
    const lowered = query.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(lowered)
      )
    );
  }, [rows, query]);

  const columns = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0] || {}).filter((key) => key !== "id");
    return [
      {
        title: "No.",
        dataIndex: "id",
        key: "id",
        width: 80,
        render: (_: any, record: RecordRow, index: number) =>
          record.id ?? index + 1,
      },
      ...keys.map((key) => {
        const col: any = { title: key, dataIndex: key, key };
        if (key === "comment_count" || key === "like_count") {
          col.sorter = (a: RecordRow, b: RecordRow) =>
            Number(a[key] ?? 0) - Number(b[key] ?? 0);
        }
        if (key === "created_at") {
          col.sorter = (a: RecordRow, b: RecordRow) => {
            const ta = new Date(a[key] ?? 0).getTime();
            const tb = new Date(b[key] ?? 0).getTime();
            return ta - tb;
          };
        }
        return col;
      }),
    ];
  }, [rows]);

  const startTimeTitle = meta && meta.startTime != null && meta.startTime !== ""
    ? `_${meta.startTime}`
    : "";
  const endTimeTitle = meta && meta.endTime != null && meta.endTime !== ""
    ? `_${meta.endTime}`
    : "";
  const titleText = meta
    ? `${meta.accountId}_${formatRunTime(runId)}` + startTimeTitle + endTimeTitle
    : runId
    ? `Run ${formatRunTime(runId)}`
    : chrome.i18n.getMessage("previewLabel");

  const handleExport = async () => {
    if (!runId) return;
    await sendRuntimeMessage({
      type: EXPORT_RUN,
      payload: { runId: Number(runId) },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: brandColors.background, fontFamily: '"Courier New", monospace' }}>
      <Layout.Content style={{ padding: "24px 28px" }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
            <Space align="baseline" size={12}>
        <Typography.Title level={4} style={{ marginBottom: 0, fontFamily: '"Courier New", monospace', color: "#3b2b00", letterSpacing: "0.04em" }}>
                {titleText}
              </Typography.Title>
              <Typography.Text style={{ fontFamily: '"Courier New", monospace', color: brandColors.textMuted }}>
                {chrome.i18n.getMessage("totalLabel")}: {filteredRows.length}
              </Typography.Text>
            </Space>
            <Button type="primary" onClick={handleExport}>{chrome.i18n.getMessage("exportLabel")}</Button>
          </Space>
          <Input
            placeholder={chrome.i18n.getMessage("searchLabel")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 360, fontFamily: '"Courier New", monospace', background: brandColors.surface, color: "#3b2b00" }}
          />
        </Space>
        <Table
          size="small"
          bordered
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          rowKey={(record, index) => (record.id ?? index) as any}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (_page, nextPageSize) => {
              if (nextPageSize) setPageSize(nextPageSize);
            },
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
          }}
          scroll={{ x: true }}
          style={{ marginTop: 16, fontFamily: '"Courier New", monospace', background: brandColors.surface, border: `2px solid ${brandColors.border}`, borderRadius: 4, overflow: "hidden", boxShadow: brandColors.glow }}
        />
      </Layout.Content>
    </Layout>
  );
};

const rootEl = document.getElementById("viewer-root");
if (rootEl) {
  createRoot(rootEl).render(
    <ConfigProvider theme={antdYellowTheme}>
      <ViewerApp />
    </ConfigProvider>
  );
}
