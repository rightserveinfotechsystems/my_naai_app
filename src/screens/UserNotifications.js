import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { communication } from '../services/communication';

const UserNotifications = ({ route, navigation }) => {
    // const { salonId } = route.params;

    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         title: 'Notifications',
    //         headerStyle: { backgroundColor: '#121212' },
    //         headerTintColor: '#fff',
    //     });
    // }, [navigation]);


    useEffect(() => {
        fetchNotifications(1, false);
    }, []);

    /* ---------------- FETCH LIST ---------------- */
    const fetchNotifications = async (pageNo = 1, loadMore = false) => {
        if (loadingMore || (loadMore && !hasMore)) return;

        loadMore ? setLoadingMore(true) : setLoading(true);

        try {
            const res = await communication.userNotificationListUser({
                // salonId,
                page: pageNo,
            });

            if (res?.status === 'SUCCESS') {
                console.log("userNotificationListUser", res);

                const newData = res.data.notifications || [];
                const pagination = res.data.pagination || {};

                setNotifications(prev =>
                    loadMore ? [...prev, ...newData] : newData
                );

                setPage(pagination.page);
                setHasMore(pagination.page < pagination.totalPages);
            } else {
                if (!loadMore) setNotifications([]);
                setHasMore(false);
            }
        } catch (error) {
            console.log('Notification error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    /* ---------------- REFRESH ---------------- */
    const onRefresh = () => {
        setRefreshing(true);
        setHasMore(true);
        fetchNotifications(1, false);
    };

    /* ---------------- LOAD MORE ---------------- */
    const handleLoadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            fetchNotifications(page + 1, true);
        }
    };

    /* ---------------- RENDER ITEM ---------------- */
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.textWrap}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.body}</Text>
                <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleString()}
                </Text>
            </View>
        </View>
    );

    /* ---------------- EMPTY ---------------- */
    const EmptyState = () => (
        <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={50} color="#666" />
            <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            {/* 🔥 Custom Header */}
            <View style={styles.header}>
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="#fff"
                    onPress={() => navigation.goBack()}
                />
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#E1B378" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.notificationId}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#E1B378"
                        />
                    }
                    ListEmptyComponent={<EmptyState />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore && (
                            <ActivityIndicator
                                size="small"
                                color="#E1B378"
                                style={{ marginVertical: 20 }}
                            />
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default UserNotifications;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },

    /* 🔥 HEADER */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#2a2a2a',
        marginBottom: 10,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },

    /* 🔥 CARD */
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,

        // subtle shadow (Android)
        elevation: 2,
    },

    textWrap: {
        flex: 1,
    },

    title: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    message: {
        color: '#bbb',
        fontSize: 13.5,
        marginTop: 4,
        lineHeight: 18,
    },

    time: {
        color: '#888',
        fontSize: 11,
        marginTop: 6,
    },

    /* 🔥 EMPTY STATE */
    empty: {
        alignItems: 'center',
        marginTop: 120,
    },

    emptyText: {
        color: '#777',
        marginTop: 10,
        fontSize: 13,
    },
});