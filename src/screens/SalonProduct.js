import React, { useEffect, useState } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { communication, getServerUrl } from '../services/communication';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const SalonProduct = () => {
    const [products, setProducts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [productForm, setProductForm] = useState({
        productName: '',
        price: '',
        rating: '',
        isAvailable: true,
        productImage: '',
        phoneNumber: '',
    });


    const buildImageUrl = path => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${getServerUrl()}/getFiles/${path}`;
    };

    const fetchProducts = async () => {
        try {
            const response = await communication.salonProductList({});
            console.log("salonProductList", response);

            if (response?.status === 'SUCCESS') {
                const apiProducts = response?.data?.products.map(p => ({
                    id: p.productId,
                    name: p.productName,
                    price: p.price,
                    rating: parseFloat(p.rating),
                    available: p.isAvailable,
                    image: p.productImage ? `${getServerUrl()}/getFiles/${p.productImage}` : null,
                }));
                setProducts(apiProducts);
            } else {
                setProducts([]);
            }
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch products');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const pickAndUploadImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.didCancel || !result.assets?.length) return;

            const asset = result.assets[0];
            console.log('Selected image:', asset);

            // Show a preview instantly before upload
            setProductForm(prev => ({
                ...prev,
                productImage: asset.uri,
            }));

            // Upload using Blob Util
            const response = await RNBlobUtil.fetch(
                'POST',
                `${getServerUrl()}/api/upload/upload-image`,
                {
                    'Content-Type': 'multipart/form-data',
                },
                [
                    {
                        name: 'image', // backend field
                        filename: asset.fileName || `image_${Date.now()}.jpg`,
                        type: asset.type || 'image/jpeg',
                        data: RNBlobUtil.wrap(asset.uri.replace('file://', '')),
                    },
                ]
            );

            const data = response.json();
            console.log('Upload success:', data);

            if (data?.success) {
                // const imageUrl = `${getServerUrl()}${data.url}`;
                // Update productForm with the final uploaded URL
                setProductForm(prev => ({
                    ...prev,
                    productImage: data.url.replace(/^\/+/, ''),
                }));
            } else {
                Alert.alert('Upload Failed', data?.message || 'Failed to upload image');
            }
        } catch (error) {
            console.log('Upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
        }
    };


    const saveProduct = async () => {
        if (isSaving) return; // ✅ prevent double click

        const { productName, price, rating, isAvailable, productImage, phoneNumber } = productForm;

        if (!productName || !price) {
            Alert.alert('Required', 'Product name and price are required');
            return;
        }

        const safeRating = Math.min(Math.max(parseFloat(rating) || 0, 0), 5);

        const payload = {
            productId: editId || null,
            productName,
            price,
            rating: safeRating,
            isAvailable,
            productImage,
            phoneNumber,
        };

        try {
            setIsSaving(true); // 🔒 LOCK BUTTON

            let response;
            if (editId) {
                response = await communication.updateProductList(payload);
            } else {
                response = await communication.createProductList(payload);
            }

            if (response?.status === 'SUCCESS') {
                const updated = response.data;

                const newProduct = {
                    id: updated.productId,
                    name: updated.productName,
                    price: updated.price,
                    rating: parseFloat(updated.rating),
                    available: updated.isAvailable,
                    image: updated.productImage
                        ? `${getServerUrl()}/getFiles/${updated.productImage}`
                        : null,
                };

                if (editId) {
                    setProducts(prev =>
                        prev.map(p => (p.id === editId ? newProduct : p))
                    );
                } else {
                    setProducts(prev => [newProduct, ...prev]);
                }

                // Alert.alert(
                //     'Success',
                //     editId ? 'Product updated successfully' : 'Product added successfully'
                // );

                resetForm();
            } else {
                Alert.alert('Error', response?.message || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to save product');
        } finally {
            setIsSaving(false); // 🔓 UNLOCK BUTTON
        }
    };




    const resetForm = () => {
        setModalVisible(false);
        setEditId(null);
        setProductForm({
            productName: '',
            price: '',
            rating: '',
            isAvailable: true,
            productImage: '',
            phoneNumber: '',
        });
    };

    const editProduct = item => {
        setEditId(item.id);
        setProductForm({
            productName: item.name,
            price: item.price,
            rating: String(item.rating),
            isAvailable: item.available,
            productImage: item.image
                ? item.image.replace(`${getServerUrl()}/getFiles/`, '')
                : '',
            phoneNumber: '',
        });
        setModalVisible(true);
    };


    const handleDeleteProduct = (productId) => {
        Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await communication.deleteProduct(productId);
                        if (response?.status === 'SUCCESS') {
                            setProducts(prev => prev.filter(p => p.id !== productId));
                            console.log('Deleted', 'Product deleted successfully');
                        } else {
                            console.log('Error', response?.message || 'Failed to delete product');
                        }
                    } catch (error) {
                        console.log('Error', error?.response?.data?.message || 'Failed to delete product');
                    }
                },
            },
        ]);
    };



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
                    <Text style={[styles.availability, { color: item.available ? '#4CAF50' : '#F44336' }]}>
                        {item.available ? 'In Stock' : 'Out of Stock'}
                    </Text>
                    <Switch
                        value={item.available}
                        onValueChange={() =>
                            setProducts(prev =>
                                prev.map(p => (p.id === item.id ? { ...p, available: !p.available } : p))
                            )
                        }
                    />
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => editProduct(item)}>
                        <Ionicons name="create-outline" size={18} color="#E0B973" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
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
                        ListEmptyComponent={<Text style={styles.empty}>No products available</Text>}
                    />

                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={28} color="#000" />
                    </TouchableOpacity>

                    <Modal visible={modalVisible} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>{editId ? 'Edit Product' : 'Add Product'}</Text>
                                <ScrollView>
                                    <TouchableOpacity style={styles.imagePicker} onPress={pickAndUploadImage}>
                                        {productForm.productImage ? (
                                            <Image
                                                source={{ uri: buildImageUrl(productForm.productImage) }}
                                                style={styles.pickedImage}
                                            />

                                        ) : (
                                            <Ionicons name="camera-outline" size={26} color="#999" />
                                        )}
                                    </TouchableOpacity>

                                    <TextInput
                                        placeholder="Product Name"
                                        placeholderTextColor="#999"
                                        style={styles.input}
                                        value={productForm.productName}
                                        onChangeText={text => setProductForm(prev => ({ ...prev, productName: text }))}
                                    />

                                    <TextInput
                                        placeholder="Price"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        style={styles.input}
                                        value={productForm.price}
                                        onChangeText={text => setProductForm(prev => ({ ...prev, price: text }))}
                                    />

                                    <TextInput
                                        placeholder="Rating (0-5)"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        style={styles.input}
                                        value={productForm.rating}
                                        onChangeText={text => {
                                            if (Number(text) <= 5) setProductForm(prev => ({ ...prev, rating: text }));
                                        }}
                                    />

                                    <View style={styles.switchRow}>
                                        <Text style={{ color: '#fff' }}>Available</Text>
                                        <Switch
                                            value={productForm.isAvailable}
                                            onValueChange={value => setProductForm(prev => ({ ...prev, isAvailable: value }))}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.saveBtn,
                                            isSaving && { opacity: 0.6 }
                                        ]}
                                        onPress={saveProduct}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <Text style={styles.saveText}>
                                                {editId ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
                                            </Text>
                                        )}
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', paddingTop: 50 },
    container: { flex: 1, paddingHorizontal: 14, },

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
