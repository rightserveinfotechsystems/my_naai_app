import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// const serverUrl = "http://192.168.1.8:5000";
const serverUrl = "http://72.60.195.95:3006";
// const serverUrl = "http://localhost:5000";
// const serverUrl = "https://backend.vidyacurasolutions.com"

export function getServerUrl() {
    return serverUrl;
}
// Save token to AsyncStorage
// Save token to AsyncStorage
export async function setCookie(token) {
    try {
        await AsyncStorage.setItem('mynaai', JSON.stringify({ token }));
    } catch (error) {
        console.error("Error saving token:", error);
    }
}

// Get token from AsyncStorage
export async function getCookie() {
    try {
        const asyncStorageData = await AsyncStorage.getItem('mynaai');
        if (!asyncStorageData) return null;

        console.log("asyncStorageData", asyncStorageData);

        // Try parsing as JSON first
        try {
            const parsed = JSON.parse(asyncStorageData);
            return parsed?.token || null;
        } catch (parseError) {
            // If JSON parse fails, assume it's a plain string token (legacy format)
            console.log("Data is not JSON, treating as plain string token");
            return asyncStorageData; // Return the raw string as token
        }
    } catch (error) {
        console.error("Error reading token:", error);
        return null;
    }
}



export const communication = {
    //=================== User API===================//
    sendRegisterOtp: async (userData) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/users/send-otp-register`, userData, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createUser: async (userData) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/users/create`, userData, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userLogin: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/users/send-otp`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    verifyLogin: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/users/verify-otp`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // 
    salonByIdInfo: async ({ salonId }) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/get-salon-by-id`, { salonId }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`

                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    bookSalonService: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/booking/book`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userProfile: async ({ userId }) => {
        try {
            const response = await axios.get(`${getServerUrl()}/api/users/profile`, {
                params: { userId },
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateProfile: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/users/update`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    userSalonList: async (dataToSend) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/salon-list`, dataToSend, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    bookedSalonList: async ({ userId }) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/booking/get-list`, { userId }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userAds: async () => {
        try {
            const response = await axios.get(`${getServerUrl()}/api/advertisement/get-advertisement`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    //=================== salon API start===================//
    salonRequest: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salonrequest/create-request`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    SalonLogin: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/send-otp`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    verifySalonLogin: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/login`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("response.data", response.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    customerList: async ({ salonId }) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/booking/get-booking-list`, { salonId }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    salonProfile: async ({ salonId }) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/get-salon`, { salonId }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateSalonProfile: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/update-salon`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    SalonOpenClose: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/salons/open-close`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    salonQueueHistory: async () => {
        try {
            const response = await axios.get(`${getServerUrl()}/api/booking/get-completed-bookings`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    bookingDone: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/booking/booking-complete`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    walkInBooking: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/booking/create-walk-in`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadImages: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/upload/upload-image`, payload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    userProductList: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/products/get-all-salons-products-list`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    salonProductList: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/products/list`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    // /api/products/create
    createProductList: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/products/create`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            console.log("response.data", response.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    updateProductList: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/products/update`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            console.log("response.data", response.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    deleteProduct: async (productId) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/products/delete`, { productId }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            console.log("response.data", response.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userNotificationList: async (payload) => {
        try {
            const response = await axios.post(`${getServerUrl()}/api/notifications/get-notification-list`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userNotificationCount: async (payload) => {
        try {
            const response = await axios.get(`${getServerUrl()}/api/notifications/get-notification-count`, {
                params: payload,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

