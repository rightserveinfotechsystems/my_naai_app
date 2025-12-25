import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddOfflineCustomer = ({ navigation }) => {
  const [count, setCount] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Walk-in Customers',
      headerStyle: { backgroundColor: '#121212' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const handleAddCustomers = () => {
    const number = parseInt(count, 10);

    if (!count || isNaN(number) || number <= 0) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid number of customers'
      );
      return;
    }

    // 🔥 Push to backend / queue logic here
    console.log('Offline customers added:', number);

    Alert.alert(
      'Added to Queue ✅',
      `${number} walk-in customer(s) added successfully`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Walk-in Customers</Text>
        <Text style={styles.subtitle}>
          Enter number of customers who came directly to the salon
        </Text>

        {/* COUNT INPUT */}
        <View style={styles.inputBox}>
          <Ionicons name="people-outline" size={20} color="#999" />
          <TextInput
            placeholder="Number of Customers"
            placeholderTextColor="#999"
            style={styles.input}
            value={count}
            onChangeText={text =>
              setCount(text.replace(/[^0-9]/g, ''))
            }
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomers}>
          <Text style={styles.addText}>Add to Queue</Text>
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
