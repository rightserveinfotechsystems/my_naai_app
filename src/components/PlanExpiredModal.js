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
          <Text style={styles.title}>Plan Expired</Text>
          <Text style={styles.message}>
            {data?.message || "Your plan has expired. Please renew."}
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Renew Now" onPress={handleRenew} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { textAlign: "center", marginBottom: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
});