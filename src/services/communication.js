import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { navigationRef } from "../../App.jsx";
import { CommonActions } from "@react-navigation/native";
const serverUrl = "http://192.168.1.6:5000";
// const serverUrl = "http://192.168.1.8:5001";
// const serverUrl = "http://localhost:5001";
// const serverUrl = "https://backend.mynaai.in"
// export const rzp_key = "rzp_test_SRombQCQU03uVL"
export const rzp_key = "rzp_live_ST8yVm3RaFMiHW"
// 

export function getServerUrl() {
    // return "http://192.168.1.18:5003";
    // return "http://192.168.1.8:5001";
    return "https://backend.mynaai.in";
}

const api = axios.create({
    // baseURL: "http://192.168.1.18:5003",
    baseURL: "http://192.168.1.6:5000",
    // baseURL: "https://backend.mynaai.in",
});
// console.log("api", api);


api.interceptors.response.use(
    //      response => {
    //     console.log("SUCCESS RESPONSE");
    //     return response;
    //   },
    //   error => {
    //     console.log("INTERCEPTOR ERROR HIT");
    //     console.log("FULL ERROR 👉", error?.response);
    //     return Promise.reject(error);
    //   }
    // );
    response => response,

    error => {
        const status = error?.response?.data?.status;
        console.log("status", status);


        if (status === "PLAN_EXPIRED") {
            navigationRef.current.navigate("RenewalSubscriptionsPlan", {
                isUpgrade: true,
            });

            // Alert.alert(
            //     "Plan Expired",
            //     "Your plan is finished, please renew",
            //     [
            //         {
            //             text: "OK",
            //             onPress: () => {
            //                 isPlanAlertShown = false;

            //                 if (navigationRef?.current) {
            //                     navigationRef.current.dispatch(
            //                         CommonActions.reset({
            //                             routes: [
            //                                 {
            //                                     name: "Salon",
            //                                     state: {
            //                                         routes: [
            //                                             {
            //                                                 name: "Account",
            //                                             },
            //                                         ],
            //                                     },
            //                                 },
            //                                 {
            //                                     name: "SubscriptionsPlan",
            //                                     params: { isUpgrade: true },
            //                                 },
            //                             ]
            //                         })
            //                     );
            //                 }
            //             },
            //         },
            //     ],
            //     { cancelable: false }
            // );
        }

        return Promise.reject(error);
    }
);



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
            // console.log("Data is not JSON, treating as plain string token");
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
            const response = await api.post(`/api/users/send-otp-register`, userData, {
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
            const response = await api.post(`/api/users/create`, userData, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userOnBoard: async (userData) => {
        try {
            const response = await api.post(`/api/users/onboard`, userData, {
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
            const response = await api.post(`/api/users/send-otp`, payload, {
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
            const response = await api.post(`/api/users/verify-otp`, payload, {
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
            const response = await api.post(`/api/salons/get-salon-by-id`, { salonId }, {
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
            const response = await api.post(`/api/booking/book`, payload, {
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
    createBookingRequest: async (payload) => {
        try {
            const response = await api.post(`/api/bookingRequest/create-booking-request`, payload, {
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
    getBookingRequestById: async (bookingRequestId) => {
        try {
            const response = await api.get(`/api/bookingRequest/get-bookingRequest-by-id/${bookingRequestId}/`, {
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
    bookingRequestOwnerAction: async (bookingRequestId, payload) => {
        try {
            const response = await api.post(`/api/bookingRequest/owner-action/${bookingRequestId}/`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${await getCookie()}`
                    },
                }
            );
            console.log("response.data;", response.data);

            return response.data;

        } catch (error) {
            throw error;
        }
    },
    customerDelayResponse: async (bookingRequestId, payload) => {
        try {
            const response = await api.post(`/api/bookingRequest/customer-delay-response/${bookingRequestId}/`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${await getCookie()}`
                    },
                }
            );

            return response.data;

        } catch (error) {
            throw error;
        }
    },
    bookingRequestCancel: async (bookingRequestId) => {
        try {
            const response = await api.post(`/api/booking/booking-request-cancel/${bookingRequestId}`, {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${await getCookie()}`
                    },
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    userProfile: async ({ userId }) => {
        try {
            const response = await api.get(`/api/users/profile`, {
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
            const response = await api.post(`/api/users/update`, payload, {
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
            const response = await api.post(`/api/salons/salon-list`, dataToSend, {
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
            const response = await api.post(`/api/booking/get-list`, { userId }, {
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
            const response = await api.get(`/api/advertisement/get-advertisement`, {
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


    salonOwnerLogin: async (payload) => {
        try {
            const response = await api.post(`/api/salons/send-register-otp`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createPaymentOrder: async (payload) => {
        try {
            const response = await api.post(`/api/salons/create-payment-order`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createSalon: async (payload, config = {}) => {
        try {
            const response = await api.post(`/api/salons/create-salon-with-plan`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...config.headers,
                    },
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    renewSalon: async (payload) => {
        try {
            const response = await api.post(`/api/salons/renew-salon-plan`, payload, {
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
    verifySalonOwnerLogin: async (payload) => {
        try {
            const response = await api.post(`/api/salons/verify-otp-register`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    salonRequest: async (payload) => {
        try {
            const response = await api.post(`/api/salonrequest/create-request`, payload, {
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
            const response = await api.post(`/api/salons/send-otp`, payload, {
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
            const response = await api.post(`/api/salons/login`, payload, {
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
    customerList: async (payload) => {
        try {
            const response = await api.post(`/api/booking/get-booking-list`, payload, {
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
            const response = await api.post(`/api/salons/get-salon`, { salonId }, {
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

    deleteSalonService: async (serviceId) => {
        try {
            const response = await api.post(`/api/salons/delete-service`, { serviceId }, {
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
    deleteSalonBarber: async (barberId) => {
        try {
            const response = await api.delete(`/api/barbers/delete-barber`, {
                data: { barberId },
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
    updateSalonProfile: async (payload) => {
        try {
            const response = await api.post(`/api/salons/update-salon`, payload, {
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
            const response = await api.post(`/api/salons/open-close`, payload, {
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
            const response = await api.get(`/api/booking/get-completed-bookings`, {
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
            const response = await api.post(`/api/booking/booking-complete`, payload, {
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
    getBarbersList: async (payload) => {
        try {
            const response = await api.get(`/api/barbers/get-salon-barbers`, {
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
    walkInBooking: async (payload) => {
        try {
            const response = await api.post(`/api/booking/create-walk-in`, payload, {
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

    uploadImages: async (formData) => {
        try {
            const response = await api.post(`/api/upload/upload-image`, formData, {
                transformRequest: () => formData,
                timeout: 30000,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    userProductList: async (payload) => {
        try {
            const response = await api.post(`/api/products/get-all-salons-products-list`, payload, {
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
            const response = await api.post(`/api/products/list`, payload, {
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
            const response = await api.post(`/api/products/create`, payload, {
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
            const response = await api.post(`/api/products/update`, payload, {
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
            const response = await api.post(`/api/products/delete`, { productId }, {
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
            const response = await api.post(`/api/notifications/get-salon-notification-list`, payload, {
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
    userNotificationListUser: async (payload) => {
        try {
            const response = await api.post(`/api/notifications/get-user-notification-list`, payload, {
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
            const response = await api.get(`/api/notifications/get-notification-count`, {
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
    toggleSaveSalon: async (payload) => {
        try {
            const response = await api.post(`/api/users/toggle-saved-salon`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getCookie()}`
                },
            });
            console.log("response.data", response?.data);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    saveSalon: async (payload) => {
        try {
            const response = await api.post(`/api/users/save-salon`, payload, {
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
    removeSalon: async (payload) => {
        try {
            const response = await api.post(`/api/users/remove-salon`, payload, {
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

