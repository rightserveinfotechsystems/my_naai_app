import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Switch,
    Alert,
    ImageBackground,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const SalonProduct = () => {
    const [products, setProducts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editId, setEditId] = useState(null);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [rating, setRating] = useState('');
    const [image, setImage] = useState(null);
    const [available, setAvailable] = useState(true);

    /* ---------------- IMAGE PICKER ---------------- */
    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
        });

        if (!result.didCancel && result.assets?.length > 0) {
            setImage(result.assets[0].uri);
        }
    };

    /* ---------------- SAVE PRODUCT ---------------- */
    const saveProduct = () => {
        if (!name || !price) {
            Alert.alert('Required', 'Product name and price are required');
            return;
        }

        let safeRating = parseFloat(rating);
        if (isNaN(safeRating)) safeRating = 4;
        if (safeRating > 5) safeRating = 5;
        if (safeRating < 0) safeRating = 0;

        if (editId) {
            setProducts(prev =>
                prev.map(p =>
                    p.id === editId
                        ? {
                            ...p,
                            name,
                            price,
                            rating: safeRating,
                            image,
                            available,
                        }
                        : p
                )
            );
        } else {
            setProducts(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    name,
                    price,
                    rating: safeRating,
                    image,
                    available,
                },
            ]);
        }

        resetForm();
    };

    const resetForm = () => {
        setModalVisible(false);
        setEditId(null);
        setName('');
        setPrice('');
        setRating('');
        setImage(null);
        setAvailable(true);
    };

    /* ---------------- EDIT ---------------- */
    const editProduct = item => {
        setEditId(item.id);
        setName(item.name);
        setPrice(String(item.price));
        setRating(String(item.rating));
        setImage(item.image);
        setAvailable(item.available);
        setModalVisible(true);
    };

    /* ---------------- DELETE ---------------- */
    const deleteProduct = id => {
        Alert.alert('Delete Product', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                    setProducts(prev => prev.filter(p => p.id !== id)),
            },
        ]);
    };

    /* ---------------- PRODUCT CARD ---------------- */
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={30} color="#777" />
                </View>
            )}

            <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                </Text>

                <View style={styles.row}>
                    <Text style={styles.price}>₹ {item.price}</Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <Text
                        style={[
                            styles.availability,
                            { color: item.available ? '#4CAF50' : '#F44336' },
                        ]}
                    >
                        {item.available ? 'In Stock' : 'Out of Stock'}
                    </Text>

                    <Switch
                        value={item.available}
                        onValueChange={() =>
                            setProducts(prev =>
                                prev.map(p =>
                                    p.id === item.id
                                        ? { ...p, available: !p.available }
                                        : p
                                )
                            )
                        }
                    />
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => editProduct(item)}>
                        <Ionicons name="create-outline" size={18} color="#E0B973" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteProduct(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        contentContainerStyle={{ paddingBottom: 120 }}
                        ListEmptyComponent={
                            <Text style={styles.empty}>No products added</Text>
                        }
                    />

                    {/* ADD BUTTON */}
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color="#000" />
                    </TouchableOpacity>

                    {/* MODAL */}
                    <Modal visible={modalVisible} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>
                                    {editId ? 'Edit Product' : 'Add Product'}
                                </Text>

                                <ScrollView>
                                    <TouchableOpacity
                                        style={styles.imagePicker}
                                        onPress={pickImage}
                                    >
                                        {image ? (
                                            <Image
                                                source={{ uri: image }}
                                                style={styles.pickedImage}
                                            />
                                        ) : (
                                            <Ionicons
                                                name="camera-outline"
                                                size={26}
                                                color="#999"
                                            />
                                        )}
                                    </TouchableOpacity>

                                    <TextInput
                                        placeholder="Product Name"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                    />

                                    <TextInput
                                        placeholder="Price"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        style={styles.input}
                                        value={price}
                                        onChangeText={setPrice}
                                    />

                                    <TextInput
                                        placeholder="Rating (0 - 5)"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        style={styles.input}
                                        value={rating}
                                        onChangeText={text => {
                                            if (Number(text) <= 5) setRating(text);
                                        }}
                                    />

                                    <View style={styles.switchRow}>
                                        <Text style={{ color: '#fff' }}>Available</Text>
                                        <Switch value={available} onValueChange={setAvailable} />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.saveBtn}
                                        onPress={saveProduct}
                                    >
                                        <Text style={styles.saveText}>
                                            {editId ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={resetForm}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </ImageBackground>
    );
};

export default SalonProduct;


const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)' },
    container: { flex: 1, padding: 16 },

    card: {
        backgroundColor: '#1C1C1C',
        borderRadius: 16,
        marginBottom: 16,
        width: CARD_WIDTH,
        overflow: 'hidden',
    },

    image: { height: 120, width: '100%' },

    imagePlaceholder: {
        height: 120,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cardContent: { padding: 10 },

    productName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    price: {
        color: '#E0B973',
        fontSize: 14,
        fontWeight: '600',
    },

    rating: { flexDirection: 'row', alignItems: 'center' },

    ratingText: { color: '#fff', marginLeft: 4, fontSize: 12 },

    availability: { fontSize: 11, fontWeight: '600' },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 14,
        marginTop: 6,
    },

    addBtn: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        height: 56,
        width: 56,
        borderRadius: 28,
        backgroundColor: '#E0B973',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },

    modal: {
        backgroundColor: '#1C1C1C',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },

    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },

    input: {
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 12,
        color: '#fff',
        marginBottom: 12,
    },

    imagePicker: {
        height: 120,
        backgroundColor: '#2A2A2A',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    pickedImage: { height: '100%', width: '100%', borderRadius: 14 },

    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    saveBtn: {
        backgroundColor: '#E0B973',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },

    saveText: { fontWeight: '800', color: '#000' },

    cancelText: {
        color: '#F44336',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '600',
    },

    empty: {
        color: '#777',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
});
