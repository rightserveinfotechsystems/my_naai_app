import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { navigationRef } from "../navigation/RootNavigation";
import { resetPlanFlag } from "../services/api";

// Dark modal matching the web (my-naai-web .modal-card): #151A19 sheet, gold
// border, gold primary + secondary buttons — no white surfaces.
export default function PlanExpiredModal({ modalVisible, setModalVisible, data }) {
  const handleRenew = () => {
    setModalVisible(false);
    resetPlanFlag(); // allow future API calls to trigger PLAN_EXPIRED

    if (navigationRef.isReady()) {
      navigationRef.navigate("SubscriptionsPlan", { mode: "RENEW" });
    } else {
      setTimeout(() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("SubscriptionsPlan", { mode: "RENEW" });
        }
      }, 500);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text allowFontScaling={false} style={styles.title}>Plan Expired</Text>
          <Text allowFontScaling={false} style={styles.message}>
            {data?.message || "Your plan has expired. Please renew."}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text allowFontScaling={false} style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.renewBtn} onPress={handleRenew}>
              <Text allowFontScaling={false} style={styles.renewText}>Renew Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.76)",
  },
  modalView: {
    width: "88%",
    maxWidth: 440,
    backgroundColor: "#151A19",
    borderWidth: 1,
    borderColor: "rgba(232,185,126,0.28)",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },
  title: {
    color: "#F8F8F5",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  message: {
    color: "#B7BEBE",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#1C2121",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#F8F8F5",
    fontWeight: "700",
    fontSize: 13,
  },
  renewBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#E8B97E",
    alignItems: "center",
    justifyContent: "center",
  },
  renewText: {
    color: "#0C0D0D",
    fontWeight: "700",
    fontSize: 13,
  },
});