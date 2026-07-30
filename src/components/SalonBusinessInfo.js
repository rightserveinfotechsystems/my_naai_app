import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DEFAULT_SERVICES, SALON_OPTIONS } from '../utilities/citiesRequestArray';

const BG_IMAGE = require('../assets/salon_page_bg.png');

const SalonBusinessInfo = ({ navigation, route }) => {
    const { step1Data } = route.params;
    console.log("step1Data business data", step1Data);


    const getDefaultOpeningTime = () => {
        const d = new Date();
        d.setHours(9, 0, 0);
        return d;
    };

    const getDefaultClosingTime = () => {
        const d = new Date();
        d.setHours(22, 0, 0);
        return d;
    };

    const [agentCode, setAgentCode] = useState('');
    const [genderType, setGenderType] = useState('');
    const [openingTime, setOpeningTime] = useState(getDefaultOpeningTime());
    const [closingTime, setClosingTime] = useState(getDefaultClosingTime());
    const [showOpenPicker, setShowOpenPicker] = useState(false);
    const [showClosePicker, setShowClosePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const formatDisplayTime = (date) => {
        let h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

    const formatTime = (date) => {
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}:00`;
    };
    const getTimeInMinutes = (date) => {
        return date.getHours() * 60 + date.getMinutes();
    };
    const handleSubmit = () => {
        if (!genderType) {
            Alert.alert("Validation", "Please select salon type");
            return;
        }
        if (agentCode && agentCode.length !== 10) {
            Alert.alert("Warn", "Agent Code must be exactly 10 digits or Blank");
            return;
        }
        const openMinutes = getTimeInMinutes(openingTime);
        const closeMinutes = getTimeInMinutes(closingTime);
        if (closeMinutes === openMinutes) {
            Alert.alert("Validation", "Opening and closing time cannot be same");
            return;
        }
        const services = DEFAULT_SERVICES[genderType?.toLowerCase()] || [];
        console.log("GenderType:", genderType);
        console.log("Mapped Services:", DEFAULT_SERVICES[genderType?.toLowerCase()]);
        setLoading(true);

        const finalPayload = {
            ...step1Data,
            agentCode,
            genderType,
            businessHours:
            {
                openingTime: formatTime(openingTime),
                closingTime: formatTime(closingTime),
                breakStartTime: null,
                breakEndTime: null,
            },
            services: services,

        };

        console.log("FINAL PAYLOAD:", finalPayload);

        setTimeout(() => {
            setLoading(false);

            navigation.navigate("SubscriptionsPlan", {
                userData: finalPayload,
            });
        }, 500);
    };

    return (
        <ImageBackground source={BG_IMAGE} style={styles.bg}>
            <View style={styles.overlay}>
                <SafeAreaView style={{ flex: 1 }}>

                    {/* 🔙 Back Button */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}
                    >
                        <Text allowFontScaling={false}style={styles.title}>Business Details</Text>

                        {/* Step Indicator */}
                        <Text allowFontScaling={false}style={styles.stepText}>Step 2 of 2</Text>


                        {/* Salon Type */}
                        <View style={styles.inputBox}>
                            <RNPickerSelect
                                placeholder={{ label: 'Select Salon Type', value: null }}
                                value={genderType}
                                onValueChange={setGenderType}
                                items={SALON_OPTIONS}
                                style={{
                                    inputAndroid: styles.pickerInput,
                                    inputIOS: styles.pickerInput,
                                    placeholder: { color: '#999' },
                                }}
                                useNativeAndroidPickerStyle={false}
                            />
                        </View>

                        {/* Opening Time */}
                        <Text allowFontScaling={false}style={styles.label}>Opening Time</Text>
                        <View style={styles.inputBox}>
                            <TouchableOpacity onPress={() => setShowOpenPicker(true)}>
                                <Text allowFontScaling={false}style={{ color: '#fff' }}>
                                    {formatDisplayTime(openingTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Closing Time */}
                        <Text allowFontScaling={false}style={styles.label}>Closing Time</Text>
                        <View style={styles.inputBox}>
                            <TouchableOpacity onPress={() => setShowClosePicker(true)}>
                                <Text allowFontScaling={false}style={{ color: '#fff' }}>
                                    {formatDisplayTime(closingTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Agent Code */}
                        <View style={styles.inputBox}>
                            <TextInput allowFontScaling={false}
                                placeholder="Agent Code"
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                maxLength={10}
                                value={agentCode}
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    setAgentCode(cleaned);
                                }}
                                // onChangeText={setAgentCode}
                                style={styles.input}
                            />
                        </View>


                        {/* Button */}
                        <TouchableOpacity
                            style={styles.signupBtn}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text allowFontScaling={false}style={styles.signupText}>Continue</Text>
                            )}
                        </TouchableOpacity>

                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>

            {/* Time Pickers */}
            {showOpenPicker && (
                <DateTimePicker
                    value={openingTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowOpenPicker(false);
                        if (selectedDate) setOpeningTime(selectedDate);
                    }}
                />
            )}

            {showClosePicker && (
                <DateTimePicker
                    value={closingTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowClosePicker(false);
                        if (selectedDate) setClosingTime(selectedDate);
                    }}
                />
            )}
        </ImageBackground>
    );
};

export default SalonBusinessInfo;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    bg: { flex: 1 },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.50)',
    },

    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },

    header: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
    },

    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },

    stepText: {
        color: '#aaa',
        marginBottom: 20,
    },

    label: {
        color: '#aaa',
        marginBottom: 6,
        marginLeft: 2,
    },

    inputBox: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 54,
        justifyContent: 'center',
        marginBottom: 18,
    },

    input: {
        color: '#fff',
        fontSize: 15,
    },

    pickerInput: {
        color: '#fff',
        fontSize: 15,
        height: 50,
        paddingVertical: 12,
    },

    signupBtn: {
        backgroundColor: '#E8B97E',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    signupText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});