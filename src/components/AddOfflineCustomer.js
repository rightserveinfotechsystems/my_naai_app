import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNPickerSelect from 'react-native-picker-select';
import { communication } from '../services/communication';

const AddOfflineCustomer = ({ route, navigation }) => {
  const { salonId } = route.params;

  const [customer, setCustomer] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [barbers, setBarbers] = useState([]);     // barber dropdown list
  const [barberId, setBarberId] = useState(""); // selected barber
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Walk-in Customers',
      headerStyle: { backgroundColor: '#121212' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  /* =========================
     FETCH BARBERS LIST
     ========================= */
  useEffect(() => {
    getBarbersList();
  }, []);

  const getBarbersList = async () => {
    try {
      const payload = { salonId };

      const res = await communication.getBarbersList(payload);

      if (res?.status === 'SUCCESS' && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map(item => ({
          label: item.fullName,
          value: String(item.barberId),
        }));
        setBarbers(formatted);
      } else {
        console.log('No barbers found', res);
        setBarbers([]);
        // Alert.alert('Info', 'No barbers available for this salon');
      }

    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    }
  };

  /* =========================
     SUBMIT WALK-IN CUSTOMER
     ========================= */
  const handleAddCustomers = async () => {
    if (!customer.trim()) {
      Alert.alert('Validation', 'Please enter customer name');
      return;
    }

    if (!serviceTime) {
      Alert.alert('Validation', 'Please enter service duration');
      return;
    }

    // if (!barberId) {
    //   Alert.alert('Validation', 'Please select a barber');
    //   return;
    // }

    setLoading(true);

    try {
      const payload = {
        customerName: customer,
        serviceDuration: Number(serviceTime),
      };
      if (barberId) {
        payload.barberId = String(barberId)
      }

      const res = await communication.walkInBooking(payload);

      if (res?.status === 'SUCCESS') {
        Alert.alert(
          'Success',
          res?.message || 'Added to queue successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', res?.message || 'Failed');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formCard}>
        <Text allowFontScaling={false}style={styles.title}>Walk-in Customers</Text>
        <Text allowFontScaling={false}style={styles.subtitle}>
          Enter name and service duration of walk-in customers
        </Text>

        {/* CUSTOMER NAME */}
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#999" />
          <TextInput allowFontScaling={false}
            placeholder="Customer Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={customer}
            onChangeText={setCustomer}
          />
        </View>

        {/* SERVICE DURATION */}
        <View style={styles.inputBox}>
          <Ionicons name="time-outline" size={20} color="#999" />
          <TextInput allowFontScaling={false}
            placeholder="Duration in minutes"
            placeholderTextColor="#999"
            style={styles.input}
            value={serviceTime}
            onChangeText={setServiceTime}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {/* BARBER DROPDOWN */}
        <View style={styles.inputBox}>
          <Ionicons name="cut-outline" size={20} color="#999" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <RNPickerSelect
              placeholder={{ label: 'Select Barber', value: "" }}
              value={barberId}
              onValueChange={setBarberId}
              items={barbers}
              style={{
                inputAndroid: styles.pickerInput,
                inputIOS: styles.pickerInput,
                placeholder: { color: '#999' },
              }}
              useNativeAndroidPickerStyle={false}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.addBtn, loading && { opacity: 0.6 }]}
          onPress={handleAddCustomers}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text allowFontScaling={false}style={styles.addText}>Add to Queue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddOfflineCustomer;

/* =========================
   STYLES
   ========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerInput: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#E1B378',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
