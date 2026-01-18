import React, { useState, useLayoutEffect } from 'react';
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
import { communication } from '../services/communication';

const AddOfflineCustomer = ({ route, navigation }) => {
  const { salonId } = route.params;
  // const [count, setCount] = useState('');
  const [customer, setCustomer] = useState('');
  const [serviceTime, setServiceTime] = useState('');

  const [loading, setLoading] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Walk-in Customers',
      headerStyle: { backgroundColor: '#121212' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const handleAddCustomers = async () => {
    // if (!count || isNaN(count) || count <= 0) {
    //   Alert.alert(
    //     'Invalid Number',
    //     'Please enter a valid number of customers'
    //   );
    //   return;
    // }
    setLoading(true);
    try {
      const payload = {
        customerName: customer,
        serviceDuration: serviceTime,
      }
      console.log("payload", payload);

      const res = await communication.walkInBooking(payload);

      if (res?.status === 'SUCCESS') {
        Alert.alert(
          'Success',
          res?.message || 'Added to queue successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );


      } else {
        Alert.alert('Error', res?.message || 'failed');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );

    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Walk-in Customers</Text>
        <Text style={styles.subtitle}>
          Enter name and total service duration of customers who came directly to the salon
        </Text>

        {/* COUNT INPUT */}
        <View style={styles.inputBox}>
          <Ionicons name="people-outline" size={20} color="#999" />
          <TextInput
            placeholder="Customer Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={customer}
            onChangeText={setCustomer}
          // keyboardType="number-pad"
          // maxLength={3}
          />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="time-outline" size={20} color="#999" />
          <TextInput
            placeholder="Duration in minutes"
            placeholderTextColor="#999"
            style={styles.input}
            value={serviceTime}
            onChangeText={setServiceTime}
            keyboardType="number-pad"
          // maxLength={3}
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[
            styles.addBtn,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleAddCustomers}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.addText}>Add to Queue</Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

export default AddOfflineCustomer;

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
    fontSize: 18,
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
    letterSpacing: 0.5,
  },
});
