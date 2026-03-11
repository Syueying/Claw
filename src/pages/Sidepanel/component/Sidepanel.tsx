import React, { useEffect, useState } from "react";
import MainPage from "./MainPage";
import LoginPage from "./LoginPage";
import { CLAW_C, GET_USER_TYPE, LOGIN, LOGOUT, REGISTER, USER_PROFILE } from "../../consts";
import { sendRuntimeMessage } from "../../../utils/runtime";
import { Spin } from "antd";
import { brandColors } from "../../../theme/yellowTheme";

const Sidepanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      await sendRuntimeMessage({ type: LOGOUT });
      await chrome.storage.local.clear();
    } finally {
      setIsLoggedIn(false);
    }
  };

  const resolveUserType = async (username: string) => {
    const typeRes = await sendRuntimeMessage<{ ok?: boolean; data?: any; msg?: string }>({
      type: GET_USER_TYPE,
      payload: { username: username },
    });
    console.log("get user type response", typeRes);
    if (!typeRes?.ok) {
      return { ok: false, msg: typeRes?.msg || "Get user type failed" };
    }
    const userType = Number(typeRes?.data?.permission_codes?.code ?? "0");
    return { ok: true, userType: userType };
  };

  const handleLogin = async (username: string, pwd: string, usernameOri: string) => {
    setAuthLoading(true);
    try {
      const res = await sendRuntimeMessage<{ ok?: boolean; data?: any; msg?: string }>({
        type: LOGIN,
        payload: { username, pwd },
      });
      if (!res?.ok) {
        return { ok: false, msg: res?.msg || chrome.i18n.getMessage("loginFailedLabel") };
      }
      const typeInfo = await resolveUserType(username);
      console.log("user type info", typeInfo);
      if (!typeInfo.ok) {
        return { ok: false, msg: typeInfo.msg };
      }
      const userId = res?.data?.user_id ?? res?.data?.id ?? username;
      await chrome.storage.local.set({
        [CLAW_C]: userId,
        [USER_PROFILE]: {
          username: usernameOri,
          pwd: "",
          type: typeInfo.userType
        }
      });
      setIsLoggedIn(true);
      return { ok: true, data: res?.data };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (username: string, username_ori: string, password: string) => {
    setAuthLoading(true);
    try {
      const res = await sendRuntimeMessage<{ ok?: boolean; data?: any; msg?: string }>({
        type: REGISTER,
        payload: { username, username_ori, password },
      });
      if (!res?.ok) {
        return { ok: false, msg: res?.msg || "Register failed" };
      }
      const typeInfo = await resolveUserType(username);
      if (!typeInfo.ok) {
        return { ok: false, msg: typeInfo.msg };
      }
      const userId = res?.data?.user_id ?? res?.data?.id ?? username;
      await chrome.storage.local.set({
        [CLAW_C]: userId,
        [USER_PROFILE]: {
          username: username_ori,
          pwd: "",
          type: typeInfo.userType
        }
      });
      setIsLoggedIn(true);
      return { ok: true, data: res?.data };
    } finally {
      setAuthLoading(false);
    }
  };

  const checkLogin = async () => {
    try {
      const check = await chrome.storage.local.get(CLAW_C)
      if (check?.[CLAW_C]) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (e) {
      setIsLoggedIn(false);
    } 
  }

  useEffect(() => {
    checkLogin()
  }, []);
  
  return (
    authLoading
      ? <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: brandColors.background }}><Spin size="large" /></div>
      : (isLoggedIn ? <MainPage onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} onRegister={handleRegister} />)
  );
};

export default Sidepanel;
