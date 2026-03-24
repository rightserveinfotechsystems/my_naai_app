import axios from "axios";
import { Alert } from "react-native";
import { getServerUrl, getCookie } from "./communication";
import { navigationRef } from "../navigation/RootNavigation";

const api = axios.create({
    // baseURL: getServerUrl(),
    baseURL: "http://192.168.1.12:5001",
});

let isPlanAlertShown = false;

// ✅ REQUEST INTERCEPTOR (Auto token)
api.interceptors.request.use(async (config) => {
    const token = await getCookie();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ✅ RESPONSE INTERCEPTOR (Plan expired handling)
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("INTERCEPTOR HIT 🚀");
    console.log("FULL ERROR:", JSON.stringify(error?.response?.data));

    const status =
      error?.response?.data?.status ||
      error?.response?.status ||
      error?.response?.data?.error;

    console.log("status🚨", status);

    if (status === "PLAN_EXPIRED" && !isPlanAlertShown) {
      isPlanAlertShown = true; // ✅ prevent multiple triggers
      console.log("PLAN EXPIRED 🚨");
      console.log("IS READY:", navigationRef.isReady());

      const navigateToPlan = () => {
        navigationRef.reset({
          index: 0,
          routes: [{ name: "SubscriptionsPlan", params: { mode: "RENEW" } }],
        });
      };

      if (navigationRef.isReady()) {
        navigateToPlan();
      } else {
        console.log("NAVIGATION NOT READY ❌");
        setTimeout(navigateToPlan, 500);
      }
    }

    return Promise.reject(error);
  }
);
export default api;