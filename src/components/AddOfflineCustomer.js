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
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [services, setServices] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Offline Customer',
      headerStyle: { backgroundColor: '#121212' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const handleAddCustomer = () => {
    if (!name || !mobile || !services) {
      Alert.alert('Missing Fields', 'Please fill all details');
      return;
    }

    // 🔥 Here you can push to backend / context / redux
    console.log({
      name,
      mobile,
      services,
    });

    Alert.alert('Added ✅', 'Customer added to queue', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formCard}>
        {/* Name */}
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={18} color="#999" />
          <TextInput
            placeholder="Customer Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputBox}>
          <Ionicons name="call-outline" size={18} color="#999" />
          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor="#999"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        {/* Services */}
        <View style={styles.inputBox}>
          <Ionicons name="cut-outline" size={18} color="#999" />
          <TextInput
            placeholder="Services (e.g. Haircut, Beard)"
            placeholderTextColor="#999"
            style={styles.input}
            value={services}
            onChangeText={setServices}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomer}>
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
  },

  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 15,
  },

  addBtn: {
    backgroundColor: '#E1B378',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  addText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
