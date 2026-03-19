import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { paymentForMembership } from "../utilities/paymentForMembership";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { communication } from "../services/communication";

const plans = [
  {
    id: "trial_2_months",
    title: "Introductory Trial",
    price: "₹129",
    duration: "2 Months (60 Days)",
  },
  {
    id: "monthly",
    title: "Monthly Plan",
    price: "₹99",
    duration: "Per Month",
  },
  {
    id: "quarterly",
    title: "Quarterly Plan",
    price: "₹249",
    duration: "3 Months (90 Days)",
    best: true,
  },
];

const SubscriptionsPlan = ({ navigation, route, onLoginSuccess }) => {
  const { userData } = route.params;
  console.log("Received Data:", userData);
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const createPaymentOrder = async (amount) => {
    try {
      const res = await communication.createPaymentOrder({
        amount: amount,
        currency: "INR",
      });

      console.log("ORDER RESPONSE:", res);

      return res?.order;
    } catch (err) {
      Alert.alert("Error", "Failed to create payment order");
      return null;
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      Alert.alert("Select Plan", "Please select a subscription plan");
      return;
    }

    const selected = plans.find(p => p.id === selectedPlan);
    const amount = Number(selected.price.replace("₹", ""));

    setLoading(true);

    // 🔥 1. Create Order
    const orderData = await createPaymentOrder(amount);

    if (!orderData) {
      setLoading(false);
      return;
    }

    // 🔥 2. Open Payment Gateway
    paymentForMembership(
      userData.ownerName,
      userData.phoneNumber,
      amount,
      async (paymentResponse) => {

        try {
          const finalPayload = {
            ...userData,
            planType: selectedPlan,
            paymentId: paymentResponse.paymentId,
            orderId: paymentResponse.orderId,
            signature: paymentResponse.signature,
          };

          const res = await communication.createSalon(finalPayload, {
            headers: {
              Authorization: `Bearer ${userData.tempToken}`
            }
          });

          if (res?.status === "SUCCESS") {
            Alert.alert("Account Created Successfully!");

            await AsyncStorage.setItem('userType', 'SALON');

            DeviceEventEmitter.emit('AUTH_CHANGED');

          } else {
            Alert.alert("Error", res?.message);
          }

        } catch (err) {
          Alert.alert("Error", "Account creation failed");
        } finally {
          setLoading(false);
        }
      },
      orderData.id
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header(insets)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Choose Your Plan</Text>

      {plans.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan === plan.id && styles.selectedCard,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
        >

          {plan.best && (
            <View style={styles.bestBadge}>
              <Text style={styles.bestText}>BEST VALUE</Text>
            </View>
          )}

          <Text style={styles.planTitle}>{plan.title}</Text>

          <Text style={styles.price}>{plan.price}</Text>

          <Text style={styles.duration}>{plan.duration}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.payBtn}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.payText}>Continue</Text>
        )}
      </TouchableOpacity>

    </SafeAreaView>
  );
};

export default SubscriptionsPlan;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  header: (insets) => ({
    position: 'absolute',
    top: insets.top + 10,
    left: 16,
    zIndex: 10,
  }),

  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },

  planCard: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 14,
    marginBottom: 18,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#E8B97E",
  },

  planTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  price: {
    color: "#E8B97E",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },

  duration: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },

  bestBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#E8B97E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  bestText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
  },

  payBtn: {
    backgroundColor: "#E8B97E",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  payText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});