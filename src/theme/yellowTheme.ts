export const brandColors = {
  primary: "#f4c542",
  primaryHover: "#ffd76a",
  primaryActive: "#d9a404",
  background: "#f0f2f5",
  backgroundSoft: "#fff8e1",
  surface: "#ffffff",
  surfaceStrong: "#fff3bf",
  border: "#e7c768",
  textMuted: "#8a6a12",
  tag: "#eb2f96",
  accent: "#c78c00",
  glow: "4px 4px 0 rgba(231, 199, 104, 0.28)",
};

export const antdYellowTheme = {
  token: {
    colorPrimary: brandColors.primary,
    colorInfo: brandColors.primary,
    colorSuccess: "#d9a404",
    colorWarning: "#d48806",
    colorBgBase: brandColors.background,
    colorBgContainer: brandColors.surface,
    colorBorder: brandColors.border,
    colorTextBase: "#2f2410",
    colorText: "#2f2410",
    colorTextSecondary: brandColors.textMuted,
    colorTextPlaceholder: "#b08a2a",
    colorLink: brandColors.primary,
    colorLinkHover: brandColors.primaryHover,
    colorLinkActive: brandColors.primaryActive,
    borderRadius: 6,
    boxShadow: brandColors.glow,
  },
  components: {
    Layout: {
      bodyBg: brandColors.background,
      headerBg: brandColors.surface,
      footerBg: brandColors.background,
      siderBg: brandColors.surface,
      triggerBg: brandColors.primary,
    },
    Button: {
      primaryShadow: brandColors.glow,
      defaultBorderColor: brandColors.border,
      defaultHoverBorderColor: brandColors.primary,
      defaultHoverColor: brandColors.primaryActive,
      borderRadius: 4,
    },
    Input: {
      activeBorderColor: brandColors.primary,
      hoverBorderColor: brandColors.primaryHover,
      borderRadius: 4,
    },
    DatePicker: {
      activeBorderColor: brandColors.primary,
      hoverBorderColor: brandColors.primaryHover,
      borderRadius: 4,
    },
    Form: {
      labelColor: "#5f4700",
    },
    Menu: {
      itemSelectedColor: brandColors.primaryActive,
      itemSelectedBg: brandColors.surfaceStrong,
      itemHoverColor: brandColors.primaryActive,
      horizontalItemSelectedColor: brandColors.primaryActive,
    },
    Table: {
      headerBg: brandColors.surfaceStrong,
      rowHoverBg: brandColors.backgroundSoft,
      borderColor: brandColors.border,
    },
    Alert: {
      colorWarningBg: brandColors.backgroundSoft,
      colorWarningBorder: brandColors.border,
    },
    Tag: {
      defaultBg: brandColors.surfaceStrong,
      defaultColor: brandColors.primaryActive,
    },
    Tabs: {
      itemColor: "#6b5200",
      itemSelectedColor: brandColors.primaryActive,
      itemHoverColor: brandColors.primaryHover,
      inkBarColor: brandColors.primary,
    },
  },
};
