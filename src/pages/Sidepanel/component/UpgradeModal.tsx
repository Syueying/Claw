import { FC, useEffect, useRef, useState } from "react";
import { Button, Modal, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { appFontFamily, brandColors } from "../../../theme/yellowTheme";
import { sendRuntimeMessage } from "../../../utils/runtime";
import { CHECK_PAYMENT_STATUS, CLAW_U } from "../../consts";
import { PLANS_URL } from "../../pageUrls";
import { getProPrice } from "../../../utils/price";
const POLL_INTERVAL_MS = 5000;

type Props = {
  open: boolean;
  onClose: () => void;
  onUpgraded: () => void;
};

const UpgradeModal: FC<Props> = ({ open, onClose, onUpgraded }) => {
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!paymentStarted || !open) {
      stopPolling();
      return;
    }

    const poll = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      setChecking(true);
      try {
        const res = await sendRuntimeMessage<{ ok: boolean; upgraded?: boolean }>({
          type: CHECK_PAYMENT_STATUS,
        });
        if (res?.upgraded) {
          setUpgraded(true);
          stopPolling();
          setTimeout(() => {
            onUpgraded();
            onClose();
          }, 1500);
        }
      } finally {
        checkingRef.current = false;
        setChecking(false);
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return stopPolling;
  }, [paymentStarted, open]);

  useEffect(() => {
    if (!open) {
      setPaymentStarted(false);
      setChecking(false);
      setUpgraded(false);
      stopPolling();
    }
  }, [open]);

  const handleSubscribe = async () => {
    try {
      const data = await chrome.storage.local.get(CLAW_U);
      const u = (data as Record<string, string>)[CLAW_U] || "";
      chrome.tabs.create({ url: `${PLANS_URL}?u=${encodeURIComponent(u)}` });
    } catch {
      chrome.tabs.create({ url: PLANS_URL });
    }
    setPaymentStarted(true);
  };

  const price = getProPrice();
  const proFeatures = [
    chrome.i18n.getMessage("upgradeFeature1"),
    chrome.i18n.getMessage("upgradeFeature2"),
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={360}
      styles={{
        content: {
          background: brandColors.surface,
          borderRadius: 20,
          padding: "28px 24px 24px",
          fontFamily: appFontFamily,
        },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Typography.Title
          level={4}
          style={{ margin: "0 0 6px", color: brandColors.text, fontFamily: appFontFamily }}
        >
          {chrome.i18n.getMessage("upgradeModalTitle")}
        </Typography.Title>
        <Typography.Text
          style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 13 }}
        >
          {chrome.i18n.getMessage("upgradeModalSubtitle")}
        </Typography.Text>
      </div>

      <div
        style={{
          background: brandColors.backgroundSoft,
          border: `2px solid ${brandColors.primary}`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <Typography.Text
            style={{
              color: brandColors.primary,
              fontFamily: appFontFamily,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Pro
          </Typography.Text>
          <Typography.Text style={{ color: brandColors.text, fontFamily: appFontFamily, fontWeight: 800, fontSize: 22 }}>
            {price.amount}
          </Typography.Text>
          <Typography.Text style={{ color: brandColors.textMuted, fontFamily: appFontFamily, fontSize: 13 }}>
            {price.period}
          </Typography.Text>
        </div>

        {proFeatures.map((feature, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: i < proFeatures.length - 1 ? 9 : 0,
              fontFamily: appFontFamily,
              fontSize: 13,
              color: brandColors.text,
            }}
          >
            <CheckOutlined style={{ color: brandColors.primary, fontSize: 12, flexShrink: 0 }} />
            {feature}
          </div>
        ))}
      </div>

      {upgraded ? (
        <div
          style={{
            textAlign: "center",
            color: brandColors.success,
            fontFamily: appFontFamily,
            fontWeight: 600,
            padding: "10px 0",
            fontSize: 14,
          }}
        >
          {chrome.i18n.getMessage("paymentSuccessLabel")}
        </div>
      ) : (
        <>
          {paymentStarted && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 10,
                color: brandColors.textMuted,
                fontSize: 12,
                fontFamily: appFontFamily,
              }}
            >
              {checking
                ? chrome.i18n.getMessage("checkingPaymentLabel")
                : chrome.i18n.getMessage("waitingPaymentLabel")}
            </div>
          )}

          <Button
            type="primary"
            block
            style={{ height: 44, fontFamily: appFontFamily, fontWeight: 700, marginBottom: 8 }}
            onClick={handleSubscribe}
            loading={checking}
          >
            {paymentStarted
              ? chrome.i18n.getMessage("openPaymentPageLabel")
              : chrome.i18n.getMessage("subscribeNowLabel")}
          </Button>

          {!paymentStarted && (
            <Button
              type="text"
              block
              style={{ color: brandColors.textMuted, fontFamily: appFontFamily, height: 36 }}
              onClick={onClose}
            >
              {chrome.i18n.getMessage("maybeLaterLabel")}
            </Button>
          )}
        </>
      )}
    </Modal>
  );
};

export default UpgradeModal;
