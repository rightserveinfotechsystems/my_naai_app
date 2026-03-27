import { Alert, StyleSheet } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { rzp_key } from "../services/communication";


// Payment for Membership
export const paymentForMembership = (
  name,
  mobile,
  invest,
  submitFunction,
  orderId, // 👈 NEW PARAM
  onFailure
) => {
  const convertedAmount =
    Number(invest) === 0 ? 100 : Number(invest) * 100;
  console.log("convertedAmount", convertedAmount);


  const options = {
    description: 'Transaction for register as a salon owner',
    image: 'https://res.cloudinary.com/dfdkzozqi/image/upload/v1773818628/my_naai_pay_gateway_ucntco.png',
    currency: 'INR',
    key: rzp_key,
    amount: convertedAmount,
    name: 'MyNaai',

    order_id: orderId,

    prefill: {
      email: '',
      contact: mobile || '',
      name: name || ''
    },

    theme: { color: "#E8B97E" }
  };

  RazorpayCheckout.open(options)
    .then((data) => {
      submitFunction({
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
        signature: data.razorpay_signature,
      });
    })
    .catch((error) => {
      Alert.alert('Payment Failed', error.message);
      if (onFailure) {
        onFailure(error);
      }
    });
};

// Default styles
export const defaultStyle = StyleSheet.create({
  lightGoldColor: "#E8B97E",
  // darkGreenColor: "#0e0740",
  lightBlueColor: "#B4BFFB",
  whiteColor: "#fff",
  grayColor: "#ACACAC",
  darkGrayColor: "#878787",
  orangeColor: "#F8B146",
  yellowColor: "#d4b402",
  redColor: "#f74d2f",
  greenColor: "#06d433",
  fontFamilyBold: "Lato-Bold",
  fontFamilyRegular: "Lato-Regular",
});
