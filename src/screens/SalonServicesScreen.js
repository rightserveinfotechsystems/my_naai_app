import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { wp, hp } from '../utils/AppScreen';

const GOLD = '#E1B378';
const DARK = '#121212';

const SalonServicesScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
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
                    <Text allowFontScaling={false} style={styles.serviceName}>
                        {item.serviceName}
                    </Text>

                    {/* <Text allowFontScaling={false}style={styles.serviceTime}>
                        ⏱ {item.durationMinutes} min
                    </Text> */}
                    <Text allowFontScaling={false} style={styles.servicePrice}>
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

                <Text allowFontScaling={false} style={styles.headerTitle}>
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
                    paddingBottom: 180 + Math.max(insets.bottom, 20),

                }}
                showsVerticalScrollIndicator={false}
            />

            {/* ---------- CONTINUE BUTTON ---------- */}
            <View style={[styles.bottomBar,
            {
                paddingBottom: Math.max(insets.bottom, 12),
                // bottom: Math.max(insets.bottom, 8),
                bottom: 0,
            },]}>
                <TouchableOpacity
                    style={[
                        styles.bookBtn,
                        selectedServices.length === 0 && styles.bookBtnDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={selectedServices.length === 0}
                >

                    <Text allowFontScaling={false} style={styles.bookText}>Continue</Text>
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
        fontSize: wp(4.8),
        fontWeight: '700',
        marginLeft: wp(4),
    },

    serviceCard: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: wp(3),
        borderRadius: wp(4),
        width: wp(44),
        minHeight: hp(8),
        justifyContent: 'center',
    },

    serviceActive: {
        borderWidth: 1,
        borderColor: GOLD,
    },

    serviceName: {
        color: '#fff',
        fontWeight: '500',
        fontSize: wp(3.8),
    },

    serviceTime: {
        color: GOLD,
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
    },

    bottomBar: {
        position: 'absolute',
        // bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: wp(4),
        paddingTop: hp(1.5),
        backgroundColor: '#1E1E1E',
        elevation: 20
        // borderTopWidth: 1,
        // borderTopColor: '#2A2A2A',
    },

    bookBtn: {
        backgroundColor: GOLD,
        paddingVertical: hp(1.8),
        borderRadius: wp(8),
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
        bottom: 2,
        right: 0,
    },
    bookBtnDisabled: {
        opacity: 0.4,
    },
    servicePrice: {
        color: '#E8B97E',
        fontSize: wp(3.8),
        fontWeight: '600',
    },

});
