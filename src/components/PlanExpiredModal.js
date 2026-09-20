import React from "react";
import { Modal, View, Text, Button, StyleSheet } from "react-native";
import { navigationRef } from "../navigation/RootNavigation";
import { resetPlanFlag } from "../services/api";

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
          <Text allowFontScaling={false}style={styles.title}>Plan Expired</Text>
          <Text allowFontScaling={false}style={styles.message}>
            {data?.message || "Your plan has expired. Please renew."}
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Renew Now" color="#E8B97E" onPress={handleRenew} />
            <Button title="Cancel" color="#F8F8F5" onPress={() => setModalVisible(false)} />
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
    width: "80%",
    backgroundColor: "#151A19",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#F8F8F5" },
  message: { textAlign: "center", marginBottom: 20, color: "#B7BEBE" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
});