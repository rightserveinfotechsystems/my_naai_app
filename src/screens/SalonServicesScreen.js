import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GOLD = '#E1B378';
const DARK = '#121212';

const SalonServicesScreen = ({ route, navigation }) => {
    const { salon } = route.params;
    const services = salon?.services || [];

    const [selectedServices, setSelectedServices] = useState([]);

    const toggleService = service => {
        setSelectedServices(prev => {
            const exists = prev.some(
                s => s.serviceId === service.serviceId
            );

            if (exists) {
                return prev.filter(
                    s => s.serviceId !== service.serviceId
                );
            }

            return [...prev, service];
        });
    };

    const handleContinue = () => {
        if (selectedServices.length === 0) {
            Alert.alert('Please select at least one service');
            return;
        }

        navigation.navigate('BookingSchedule', {
            salon,
            selectedServices,
        });
    };

    const renderItem = ({ item }) => {
        const selected = selectedServices.some(
            s => s.serviceId === item.serviceId
        );

        return (
            <TouchableOpacity
                style={[
                    styles.serviceCard,
                    selected && styles.serviceActive,
                ]}
                onPress={() => toggleService(item)}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.serviceName}>
                        {item.serviceName}
                    </Text>

                    {/* <Text style={styles.serviceTime}>
                        ⏱ {item.durationMinutes} min
                    </Text> */}
                    <Text style={styles.servicePrice}>
                        ₹{item.price}
                    </Text>

                    {selected && (
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={GOLD}
                            style={styles.checkIcon}
                        />
                    )}
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>


            {/* ---------- HEADER ---------- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Select Services
                </Text>
            </View>

            {/* ---------- SERVICES GRID ---------- */}
            <FlatList
                data={services}
                keyExtractor={item => item.serviceId.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={{
                    justifyContent: 'space-between',
                    marginBottom: 14,
                }}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 140,
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* ---------- CONTINUE BUTTON ---------- */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.bookBtn,
                        selectedServices.length === 0 && styles.bookBtnDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={selectedServices.length === 0}
                >

                    <Text style={styles.bookText}>Continue</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

export default SalonServicesScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 16,
    },

    serviceCard: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 10,
        borderRadius: 16,
        width: '48%',
        minHeight: 80,
        justifyContent: 'center',
    },

    serviceActive: {
        borderWidth: 1,
        borderColor: GOLD,
    },

    serviceName: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
    },

    serviceTime: {
        color: GOLD,
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
    },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: DARK,
    },

    bookBtn: {
        backgroundColor: GOLD,
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },

    bookText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },

    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    bookBtnDisabled: {
        opacity: 0.4,
    },
    servicePrice: {
        color: '#E8B97E',
        fontSize: 15,
        fontWeight: '600',
        // marginTop: 4,
    }

});
