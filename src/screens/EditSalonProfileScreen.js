import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  Linking,
  DeviceEventEmitter
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import RNBlobUtil from 'react-native-blob-util';
import Geolocation from 'react-native-geolocation-service';
import RNPickerSelect from 'react-native-picker-select';

import {
  communication,
  getServerUrl,
} from '../services/communication';

import { DAYS } from '../utilities/DaysArray';

import {
  CITY_OPTIONS,
  SALON_OPTIONS,
  DEFAULT_SERVICES,
} from '../utilities/citiesRequestArray';
import { STATE_OPTIONS } from '../utilities/stateArray';

const GOLD = '#E8B97E';
const DARK = '#101010';
const CARD = '#1D1D1D';
const INPUT = '#292929';
const WHITE = '#FFFFFF';
const MUTED = '#B5B5B5';
const BORDER = '#3A3A3A';
const GREEN = '#43A047';
const RED = '#E53935';

const MAX_IMAGE_MB = 2;
const MAX_IMAGES = 4;

const EditSalonProfileScreen = ({ navigation, route }) => {
  const routeSalonId = route?.params?.salonId;
  const isOnboarding = route?.params?.isOnboarding === true;

  const locationRequestStarted = useRef(false);

  const [salonId, setSalonId] = useState(routeSalonId || null);
  const [profileData, setProfileData] = useState({});

  // Basic details
  const [ownerName, setOwnerName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Salon details
  const [genderType, setGenderType] = useState('');
  const [agentCode, setAgentCode] = useState('');

  // Location
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [locationError, setLocationError] = useState('');

  // Images
  const [salonImages, setSalonImages] = useState([]);

  // Business details
  const [openingTime, setOpeningTime] = useState(
    createTimeDate('09:00:00'),
  );

  const [closingTime, setClosingTime] = useState(
    createTimeDate('22:00:00'),
  );

  const [pickerType, setPickerType] = useState(null);
  const [holiday, setHoliday] = useState(null);
  const [holidayPickerVisible, setHolidayPickerVisible] =
    useState(false);

  // Services and barbers
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  // Screen status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [visibleSections, setVisibleSections] = useState({
  owner: true,
  salon: true,
  address: false,
  images: false,
  businessHours: false,
  services: false,
  barbers: false,
});

const [expandedServiceId, setExpandedServiceId] = useState(null);
const [expandedBarberId, setExpandedBarberId] = useState(null);

const toggleSection = sectionName => {
  setVisibleSections(previous => ({
    ...previous,
    [sectionName]: !previous[sectionName],
  }));
};

const toggleService = serviceId => {
  setExpandedServiceId(previous =>
    previous === serviceId ? null : serviceId,
  );
};

const toggleBarber = barberId => {
  setExpandedBarberId(previous =>
    previous === barberId ? null : barberId,
  );
};

  function createTimeDate(time = '09:00:00') {
    const [hours = 9, minutes = 0, seconds = 0] = String(time)
      .split(':')
      .map(Number);

    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);

    return date;
  }

  const isValidGuid = value => {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  };

  const normaliseRemotePath = path => {
    if (!path) {
      return null;
    }

    return String(path).replace(/^\/+/, '');
  };

  const buildImageUrl = path => {
    if (!path) {
      return null;
    }

    if (
      path.startsWith('file://') ||
      path.startsWith('content://') ||
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path;
    }

    return `${getServerUrl()}/getFiles/${path.replace(/^\/+/, '')}`;
  };

  const formatTimeForApi = date => {
    if (!date) {
      return '09:00:00';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDisplayTime = date => {
    if (!date) {
      return '';
    }

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const createDefaultServices = salonType => {
    if (!salonType) {
      return [];
    }

    const mappedServices =
      DEFAULT_SERVICES?.[salonType.toLowerCase()] || [];

    return mappedServices.map((service, index) => ({
      id: `default-service-${Date.now()}-${index}`,

      name:
        typeof service === 'string'
          ? service
          : service.serviceName || service.name || '',

      price:
        typeof service === 'object' &&
        service.price !== undefined &&
        service.price !== null
          ? String(service.price)
          : '',

      duration:
        typeof service === 'object' &&
        service.durationMinutes
          ? String(service.durationMinutes)
          : typeof service === 'object' && service.duration
            ? String(service.duration)
            : '60',

      description:
        typeof service === 'object'
          ? service.description || ''
          : '',
    }));
  };

  const getStoredSalonId = async () => {
    if (routeSalonId) {
      setSalonId(routeSalonId);
      return routeSalonId;
    }

    try {
      const storedUser = await AsyncStorage.getItem('mynaaiUser');

      if (!storedUser) {
        throw new Error('Logged-in salon information was not found.');
      }

      const parsedUser = JSON.parse(storedUser);

      const storedSalonId =
        parsedUser?.salon?.salonId ||
        parsedUser?.salonId ||
        parsedUser?.user?.salonId ||
        parsedUser?.data?.salonId;

      if (!storedSalonId) {
        throw new Error('Salon ID was not found.');
      }

      setSalonId(storedSalonId);

      return storedSalonId;
    } catch (error) {
      Alert.alert(
        'Unable to Load Profile',
        error?.message || 'Salon information was not found.',
      );

      return null;
    }
  };

  const populateProfile = data => {
    const salon = data || {};

    setProfileData(salon);

    setOwnerName(salon?.ownerName || '');
    setSalonName(salon?.salonName || '');
    setPhoneNumber(salon?.phoneNumber || '');
    setEmail(salon?.email || '');

    setAddressLine1(salon?.addressLine1 || '');
    setAddressLine2(salon?.addressLine2 || '');
    setCity(salon?.city || '');
    setState(salon?.state || '');

    setPincode(
      salon?.pincode !== undefined && salon?.pincode !== null
        ? String(salon.pincode)
        : '',
    );

    setGenderType(salon?.genderType || '');
    setAgentCode(salon?.agentCode || '');

    if (salon?.latitude !== undefined && salon?.latitude !== null) {
      setLatitude(Number(salon.latitude));
    }

    if (salon?.longitude !== undefined && salon?.longitude !== null) {
      setLongitude(Number(salon.longitude));
    }

    const images = Array.isArray(salon?.imagesArray)
      ? salon.imagesArray.filter(Boolean)
      : [];

    if (!images.length && salon?.imageUrl) {
      images.push(salon.imageUrl);
    }

    setSalonImages(images.slice(0, MAX_IMAGES));

    const businessHour = Array.isArray(salon?.businessHours)
      ? salon.businessHours[0]
      : salon?.businessHours;

    if (businessHour) {
      setOpeningTime(
        createTimeDate(
          businessHour.openingTime || '09:00:00',
        ),
      );

      setClosingTime(
        createTimeDate(
          businessHour.closingTime || '22:00:00',
        ),
      );

      const firstHoliday = Array.isArray(
        businessHour?.holidayDays,
      )
        ? businessHour.holidayDays[0]
        : null;

      if (
        firstHoliday !== undefined &&
        firstHoliday !== null &&
        firstHoliday !== ''
      ) {
        if (typeof firstHoliday === 'number') {
          setHoliday(firstHoliday);
        } else {
          const matchingDay = DAYS.find(
            item =>
              String(item.value) === String(firstHoliday) ||
              item.label?.toLowerCase() ===
                String(firstHoliday).toLowerCase(),
          );

          setHoliday(matchingDay?.value ?? null);
        }
      } else {
        setHoliday(null);
      }
    }

    setServices(
      Array.isArray(salon?.services)
        ? salon.services.map((service, index) => ({
            id:
              service.serviceId ||
              `existing-service-${Date.now()}-${index}`,

            name:
              service.serviceName ||
              service.name ||
              '',

            price:
              service.price !== undefined &&
              service.price !== null
                ? String(service.price)
                : '',

            duration: String(
              service.durationMinutes ||
                service.duration ||
                60,
            ),

            description: service.description || '',
          }))
        : [],
    );

    setBarbers(
      Array.isArray(salon?.barbers)
        ? salon.barbers.map((barber, index) => ({
            id:
              barber.barberId ||
              `existing-barber-${Date.now()}-${index}`,

            name:
              barber.fullName ||
              barber.name ||
              '',

            image:
              barber.profileImageUrl ||
              barber.image ||
              null,

            rating:
              barber.ratingAverage !== undefined &&
              barber.ratingAverage !== null
                ? String(barber.ratingAverage)
                : '1',

            isAvailable: barber.isAvailable !== false,
          }))
        : [],
    );
  };

  const fetchSalonProfile = useCallback(async id => {
    if (!id) {
      return;
    }

    try {
      const response = await communication.salonProfile({
        salonId: id,
      });

      if (response?.status !== 'SUCCESS') {
        throw new Error(
          response?.message || 'Failed to load salon profile.',
        );
      }

      populateProfile(response?.data || {});
    } catch (error) {
      Alert.alert(
        'Profile Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to fetch salon profile.',
      );
    }
  }, []);

  const initialiseScreen = useCallback(async () => {
    try {
      setLoading(true);

      const id = await getStoredSalonId();

      if (id) {
        await fetchSalonProfile(id);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSalonProfile]);

  useEffect(() => {
    initialiseScreen();
  }, [initialiseScreen]);

  const handleRefresh = async () => {
    if (!salonId) {
      return;
    }

    try {
      setRefreshing(true);
      await fetchSalonProfile(salonId);
      await requestAndFetchLocation();
    } finally {
      setRefreshing(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const status =
          await Geolocation.requestAuthorization('whenInUse');

        const granted = status === 'granted';

        setLocationPermissionGranted(granted);

        return granted;
      }

      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (alreadyGranted) {
        setLocationPermissionGranted(true);
        return true;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Salon Location Required',
          message:
            'Location permission is compulsory to save your salon address and show the salon to nearby customers.',
          buttonPositive: 'Allow Location',
          buttonNegative: 'Not Now',
        },
      );

      const granted =
        result === PermissionsAndroid.RESULTS.GRANTED;

      setLocationPermissionGranted(granted);

      return granted;
    } catch (error) {
      setLocationPermissionGranted(false);
      setLocationError(
        error?.message || 'Unable to request location permission.',
      );

      return false;
    }
  };

  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');

    Geolocation.getCurrentPosition(
      position => {
        const currentLatitude = Number(
          position.coords.latitude,
        );

        const currentLongitude = Number(
          position.coords.longitude,
        );

        setLatitude(currentLatitude);
        setLongitude(currentLongitude);
        setLocationPermissionGranted(true);
        setLocationLoading(false);
        setLocationError('');
      },

      error => {
        console.log('LOCATION ERROR:', error);

        setLocationLoading(false);

        let message =
          error?.message ||
          'Unable to detect the current salon location.';

        if (error?.code === 2) {
          message =
            'Location service is unavailable. Please enable GPS and try again.';
        }

        if (error?.code === 3) {
          message =
            'Location request timed out. Please try again.';
        }

        setLocationError(message);
      },

      {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 5000,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  };

  const requestAndFetchLocation = async () => {
    const granted = await requestLocationPermission();

    if (!granted) {
      setLocationError(
        'Location permission is compulsory. Please allow location permission to update the salon profile.',
      );

      Alert.alert(
        'Location Permission Required',
        'You must allow location permission before saving the salon profile.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );

      return;
    }

    await fetchCurrentLocation();
  };

  /*
   * Automatically requests location permission and fetches current
   * latitude/longitude when the screen opens.
   */
  useEffect(() => {
    if (
      loading ||
      locationRequestStarted.current
    ) {
      return;
    }

    locationRequestStarted.current = true;
    requestAndFetchLocation();
  }, [loading]);

  const handleSalonTypeChange = selectedType => {
    if (!selectedType) {
      setGenderType('');
      return;
    }

    if (
      services.length > 0 &&
      selectedType !== genderType
    ) {
      Alert.alert(
        'Change Salon Type',
        'Would you like to keep the current services or replace them with default services for the selected salon type?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Keep Services',
            onPress: () => {
              setGenderType(selectedType);
            },
          },
          {
            text: 'Use Defaults',
            onPress: () => {
              setGenderType(selectedType);

              setServices(
                createDefaultServices(selectedType),
              );
            },
          },
        ],
      );

      return;
    }

    setGenderType(selectedType);

    if (services.length === 0) {
      setServices(createDefaultServices(selectedType));
    }
  };

  const reloadDefaultServices = () => {
    if (!genderType) {
      Alert.alert(
        'Select Salon Type',
        'Please select a salon type first.',
      );

      return;
    }

    Alert.alert(
      'Load Default Services',
      'This will replace all currently displayed services with default services for the selected salon type.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Replace Services',
          onPress: () => {
            setServices(
              createDefaultServices(genderType),
            );
          },
        },
      ],
    );
  };

  const pickImage = callback => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      },

      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert(
            'Image Error',
            response.errorMessage ||
              'Unable to select the image.',
          );

          return;
        }

        const asset = response.assets?.[0];

        if (!asset?.uri) {
          return;
        }

        const fileSizeMb =
          Number(asset.fileSize || 0) / (1024 * 1024);

        if (fileSizeMb > MAX_IMAGE_MB) {
          Alert.alert(
            'Image Too Large',
            `Please select an image smaller than ${MAX_IMAGE_MB} MB.`,
          );

          return;
        }

        callback(asset.uri);
      },
    );
  };

  const addSalonImage = () => {
    if (salonImages.length >= MAX_IMAGES) {
      Alert.alert(
        'Image Limit',
        `You can upload a maximum of ${MAX_IMAGES} salon images.`,
      );

      return;
    }

    pickImage(uri => {
      setSalonImages(previous => [
        ...previous,
        uri,
      ]);
    });
  };

  const replaceSalonImage = index => {
    pickImage(uri => {
      setSalonImages(previous => {
        const updatedImages = [...previous];
        updatedImages[index] = uri;

        return updatedImages;
      });
    });
  };

  const removeSalonImage = index => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSalonImages(previous =>
              previous.filter(
                (_, imageIndex) =>
                  imageIndex !== index,
              ),
            );
          },
        },
      ],
    );
  };

  const uploadImage = async imageUri => {
    if (!imageUri) {
      return null;
    }

    const isLocalImage =
      imageUri.startsWith('file://') ||
      imageUri.startsWith('content://');

    if (!isLocalImage) {
      if (
        imageUri.startsWith('http://') ||
        imageUri.startsWith('https://')
      ) {
        const serverUrl = `${getServerUrl()}/getFiles/`;

        if (imageUri.startsWith(serverUrl)) {
          return normaliseRemotePath(
            imageUri.replace(serverUrl, ''),
          );
        }
      }

      return normaliseRemotePath(imageUri);
    }

    const imagePath = imageUri.replace('file://', '');

    const response = await RNBlobUtil.fetch(
      'POST',
      `${getServerUrl()}/api/upload/upload-image`,
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: 'image',
          filename: `salon_${Date.now()}.jpg`,
          type: 'image/jpeg',
          data: RNBlobUtil.wrap(imagePath),
        },
      ],
    );

    const result = response.json();

    if (!result?.success || !result?.url) {
      throw new Error(
        result?.message || 'Image upload failed.',
      );
    }

    return normaliseRemotePath(result.url);
  };

  const uploadSalonImages = async () => {
    const uploadedImages = [];

    for (const image of salonImages) {
      if (!image) {
        continue;
      }

      const uploadedPath = await uploadImage(image);

      if (uploadedPath) {
        uploadedImages.push(uploadedPath);
      }
    }

    return uploadedImages;
  };

  const addService = () => {
    setServices(previous => [
      ...previous,
      {
        id: `new-service-${Date.now()}`,
        name: '',
        price: '',
        duration: '60',
        description: '',
      },
    ]);
  };

  const updateService = (
    index,
    field,
    value,
  ) => {
    setServices(previous =>
      previous.map((service, serviceIndex) =>
        serviceIndex === index
          ? {
              ...service,
              [field]: value,
            }
          : service,
      ),
    );
  };

  const removeService = serviceId => {
    Alert.alert(
      'Remove Service',
      'Are you sure you want to remove this service?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setServices(previous =>
              previous.filter(
                service => service.id !== serviceId,
              ),
            );
          },
        },
      ],
    );
  };

  const addBarber = () => {
    setBarbers(previous => [
      ...previous,
      {
        id: `new-barber-${Date.now()}`,
        name: '',
        image: null,
        rating: '1',
        isAvailable: true,
      },
    ]);
  };

  const updateBarber = (
    index,
    field,
    value,
  ) => {
    setBarbers(previous =>
      previous.map((barber, barberIndex) =>
        barberIndex === index
          ? {
              ...barber,
              [field]: value,
            }
          : barber,
      ),
    );
  };

  const removeBarber = barberId => {
    Alert.alert(
      'Remove Barber',
      'Are you sure you want to remove this barber?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setBarbers(previous =>
              previous.filter(
                barber => barber.id !== barberId,
              ),
            );
          },
        },
      ],
    );
  };

  const validateForm = () => {
    if (!ownerName.trim()) {
      Alert.alert(
        'Validation',
        'Please enter the salon owner name.',
      );

      return false;
    }

    if (!salonName.trim()) {
      Alert.alert(
        'Validation',
        'Please enter the salon name.',
      );

      return false;
    }

    if (
      !phoneNumber ||
      phoneNumber.replace(/\D/g, '').length !== 10
    ) {
      Alert.alert(
        'Validation',
        'Please enter a valid 10-digit mobile number.',
      );

      return false;
    }

    if (email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        Alert.alert(
          'Validation',
          'Please enter a valid email address.',
        );

        return false;
      }
    }

    if (!genderType) {
      Alert.alert(
        'Validation',
        'Please select the salon type.',
      );

      return false;
    }

    if (!addressLine1.trim()) {
      Alert.alert(
        'Validation',
        'Please enter the salon address.',
      );

      return false;
    }

    // if (!city) {
    //   Alert.alert(
    //     'Validation',
    //     'Please select the salon city.',
    //   );

    //   return false;
    // }

    // if (!state.trim()) {
    //   Alert.alert(
    //     'Validation',
    //     'Please enter the state.',
    //   );

    //   return false;
    // }

    // if (pincode.length !== 6) {
    //   Alert.alert(
    //     'Validation',
    //     'Please enter a valid 6-digit pincode.',
    //   );

    //   return false;
    // }

    if (
      agentCode &&
      agentCode.length !== 10
    ) {
      Alert.alert(
        'Validation',
        'Agent code must be exactly 10 digits or blank.',
      );

      return false;
    }

    if (!locationPermissionGranted) {
      Alert.alert(
        'Location Permission Required',
        'Location permission is compulsory before saving the salon profile.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );

      return false;
    }

    if (
      latitude === null ||
      longitude === null ||
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      Alert.alert(
        'Location Required',
        'Current salon location is not available. Please enable GPS and detect the location again.',
      );

      return false;
    }

    const openMinutes =
      openingTime.getHours() * 60 +
      openingTime.getMinutes();

    const closeMinutes =
      closingTime.getHours() * 60 +
      closingTime.getMinutes();

    if (openMinutes === closeMinutes) {
      Alert.alert(
        'Validation',
        'Opening and closing time cannot be the same.',
      );

      return false;
    }

    if (services.length === 0) {
      Alert.alert(
        'Validation',
        'Please add at least one salon service.',
      );

      return false;
    }

    const invalidService = services.find(
      service =>
        !service.name?.trim() ||
        service.price === '' ||
        Number(service.price) < 0 ||
        !service.duration ||
        Number(service.duration) <= 0,
    );

    if (invalidService) {
      Alert.alert(
        'Service Validation',
        'Enter a valid service name, price and duration for every service.',
      );

      return false;
    }

    const invalidBarber = barbers.find(
      barber => !barber.name?.trim(),
    );

    if (invalidBarber) {
      Alert.alert(
        'Barber Validation',
        'Please enter the name of every barber.',
      );

      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    if (!salonId) {
      Alert.alert(
        'Error',
        'Salon ID is unavailable.',
      );

      return;
    }

    try {
      setSaving(true);

      const uploadedSalonImages =
        await uploadSalonImages();

      const existingServices = services
        .filter(service => isValidGuid(service.id))
        .map(service => ({
          serviceId: service.id,
          serviceName: service.name.trim(),
          durationMinutes:
            Number(service.duration) || 60,
          price: String(service.price || 0),
          description:
            service.description?.trim() ||
            'Salon service',
        }));

      const newServices = services
        .filter(service => !isValidGuid(service.id))
        .map(service => ({
          serviceName: service.name.trim(),
          durationMinutes:
            Number(service.duration) || 60,
          price: String(service.price || 0),
          description:
            service.description?.trim() ||
            'Salon service',
        }));

      const existingBarbers = [];
      const newBarbers = [];

      for (const barber of barbers) {
        let barberImage = barber.image || null;

        if (
          barberImage?.startsWith('file://') ||
          barberImage?.startsWith('content://')
        ) {
          barberImage =
            await uploadImage(barberImage);
        } else {
          barberImage =
            normaliseRemotePath(barberImage);
        }

        const barberPayload = {
          fullName: barber.name.trim(),
          profileImageUrl: barberImage,
          ratingAverage: String(
            barber.rating || '1',
          ),
          isAvailable:
            barber.isAvailable !== false,
        };

        if (isValidGuid(barber.id)) {
          existingBarbers.push({
            barberId: barber.id,
            ...barberPayload,
          });
        } else {
          newBarbers.push(barberPayload);
        }
      }

      const existingBusinessHour = Array.isArray(
        profileData?.businessHours,
      )
        ? profileData.businessHours[0]
        : profileData?.businessHours;

      const payload = {
        salonId,

        ownerName: ownerName.trim(),
        salonName: salonName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || null,

        genderType,
        agentCode: agentCode.trim() || null,

        addressLine1: addressLine1.trim(),
        addressLine2:
          addressLine2.trim() || null,
        city,
        state: state.trim(),
        pincode: pincode.trim(),

        latitude: Number(latitude),
        longitude: Number(longitude),

        imageUrl:
          uploadedSalonImages[0] || null,

        imagesArray: uploadedSalonImages,

        existingServices,
        newServices,

        existingBarbers,
        newBarbers,

        businessHours: [
          {
            scheduleId:
              existingBusinessHour?.scheduleId ||
              undefined,

            openingTime:
              formatTimeForApi(openingTime),

            closingTime:
              formatTimeForApi(closingTime),

            breakStartTime:
              existingBusinessHour?.breakStartTime ||
              null,

            breakEndTime:
              existingBusinessHour?.breakEndTime ||
              null,

            holidayDays:
              holiday === null
                ? []
                : [holiday],
          },
        ],

        isActive: true,
        profileCompleted: true,
      };

  

      const response =
        await communication.editSalonProfile(
          payload,
        );

      if (response?.status !== 'SUCCESS') {
        throw new Error(
          response?.message ||
            'Salon profile update failed.',
        );
      }

     

      await AsyncStorage.setItem(
        'profileCompleted',
        'true',
      );

      Alert.alert(
        'Profile Updated',
        'Your salon profile has been updated successfully.',
        [
          {
            text: 'Continue',
            onPress: async () => {
            const isNewSalon = await AsyncStorage.getItem('isNewSalon');
            if(isNewSalon === 'true') {
             DeviceEventEmitter.emit('AUTH_CHANGED');
                
            }
              if (isOnboarding) {
               navigation.navigate('SubscriptionsPlan', {
                    userData: {
                        salonId: salonId,
                        ownerName: ownerName.trim(),
                        salonName: salonName.trim(),
                        phoneNumber: phoneNumber.trim(),
                        tempToken: await AsyncStorage.getItem('mynaai'),
                        isOnboarding:true
                    },
                    isUpgrade: true,
                });
              } else {
                navigation.goBack();
              }
            },
          },
        ],
      );
       await AsyncStorage.removeItem('isNewSalon');
    } catch (error) {
      console.log(
        'PROFILE UPDATE ERROR:',
        error?.response?.data || error,
      );

      Alert.alert(
        'Update Failed',
        error?.response?.data?.message ||
          error?.message ||
          'Something went wrong while updating the salon profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={GOLD}
        />

        <Text
          allowFontScaling={false}
          style={styles.loaderTitle}
        >
          Loading Salon Profile
        </Text>

        <Text
          allowFontScaling={false}
          style={styles.loaderText}
        >
          Please keep location services enabled
        </Text>
      </SafeAreaView>
    );
  }

 return (
  <SafeAreaView style={styles.container}>
    {/* HEADER */}
    <View style={styles.header}>
      {!isOnboarding ? (
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={WHITE}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}

      <View style={styles.headerTitleContainer}>
        <Text
          allowFontScaling={false}
          style={styles.headerTitle}
        >
          {isOnboarding
            ? 'Complete Salon Profile'
            : 'Edit Salon Profile'}
        </Text>

        <Text
          allowFontScaling={false}
          style={styles.headerSubtitle}
          numberOfLines={1}
        >
          Update your salon information
        </Text>
      </View>

      <TouchableOpacity
        style={styles.headerIconButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator
            size="small"
            color={GOLD}
          />
        ) : (
          <Ionicons
            name="refresh"
            size={23}
            color={GOLD}
          />
        )}
      </TouchableOpacity>
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={GOLD}
          colors={[GOLD]}
        />
      }
    >
      {/* OWNER INFORMATION */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('owner')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <Text
                allowFontScaling={false}
                style={styles.sectionTitle}
              >
                Owner Information
              </Text>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                Name, phone number and email
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              visibleSections.owner
                ? 'chevron-up-circle'
                : 'chevron-down-circle'
            }
            size={25}
            color={GOLD}
          />
        </TouchableOpacity>

        {visibleSections.owner ? (
          <View style={styles.sectionContent}>
            <FieldLabel
              label="Salon Owner Name"
              required
            />

            <TextInput
              allowFontScaling={false}
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Enter salon owner name"
              placeholderTextColor="#8D8D8D"
            />

            <FieldLabel
              label="Mobile Number"
              required
            />

            <View style={styles.phoneContainer}>
              <Text
                allowFontScaling={false}
                style={styles.countryCode}
              >
                +91
              </Text>

              <TextInput
                allowFontScaling={false}
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={text =>
                  setPhoneNumber(
                    text.replace(/\D/g, '').slice(0, 10),
                  )
                }
                keyboardType="number-pad"
                maxLength={10}
                editable={!profileData?.phoneNumber}
                placeholder="Enter mobile number"
                placeholderTextColor="#8D8D8D"
              />
            </View>

            <FieldLabel label="Email Address" />

            <TextInput
              allowFontScaling={false}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor="#8D8D8D"
            />
          </View>
        ) : null}
      </View>

      {/* SALON INFORMATION */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('salon')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="storefront-outline"
                size={21}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <Text
                allowFontScaling={false}
                style={styles.sectionTitle}
              >
                Salon Information
              </Text>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                Salon name, type and agent code
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              visibleSections.salon
                ? 'chevron-up-circle'
                : 'chevron-down-circle'
            }
            size={25}
            color={GOLD}
          />
        </TouchableOpacity>

        {visibleSections.salon ? (
          <View style={styles.sectionContent}>
            <FieldLabel
              label="Salon Name"
              required
            />

            <TextInput
              allowFontScaling={false}
              style={styles.input}
              value={salonName}
              onChangeText={setSalonName}
              placeholder="Enter salon name"
              placeholderTextColor="#8D8D8D"
            />

            <FieldLabel
              label="Salon Type"
              required
            />

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{
                  label: 'Select salon type',
                  value: null,
                }}
                value={genderType}
                onValueChange={handleSalonTypeChange}
                items={SALON_OPTIONS || []}
                useNativeAndroidPickerStyle={false}
                style={{
                  inputAndroid: styles.pickerInput,
                  inputIOS: styles.pickerInput,
                  placeholder: styles.pickerPlaceholder,
                  iconContainer: styles.pickerIconContainer,
                }}
                Icon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={21}
                    color={GOLD}
                  />
                )}
              />
            </View>

            <FieldLabel label="Agent Code" />

            <TextInput
              allowFontScaling={false}
              style={styles.input}
              value={agentCode}
              onChangeText={text =>
                setAgentCode(
                  text.replace(/\D/g, '').slice(0, 10),
                )
              }
              keyboardType="number-pad"
              maxLength={10}
              placeholder="Optional 10-digit agent code"
              placeholderTextColor="#8D8D8D"
            />
          </View>
        ) : null}
      </View>

      {/* ADDRESS AND LOCATION */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('address')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="location-outline"
                size={22}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <Text
                allowFontScaling={false}
                style={styles.sectionTitle}
              >
                Address & Location
              </Text>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
                numberOfLines={1}
              >
                Address and current GPS coordinates
              </Text>
            </View>
          </View>

          <View style={styles.sectionRight}>
            {latitude !== null &&
            longitude !== null ? (
              <Ionicons
                name="checkmark-circle"
                size={19}
                color={GREEN}
              />
            ) : null}

            <Ionicons
              name={
                visibleSections.address
                  ? 'chevron-up-circle'
                  : 'chevron-down-circle'
              }
              size={25}
              color={GOLD}
            />
          </View>
        </TouchableOpacity>

        {visibleSections.address ? (
          <View style={styles.sectionContent}>
            <FieldLabel
              label="Complete Address"
              required
            />

            <TextInput
              allowFontScaling={false}
              style={[
                styles.input,
                styles.addressTextArea,
              ]}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="House number, building, road and area"
              placeholderTextColor="#8D8D8D"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <FieldLabel label="Landmark / Address Line 2" />

            <TextInput
              allowFontScaling={false}
              style={styles.input}
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Nearby landmark"
              placeholderTextColor="#8D8D8D"
            />

            <FieldLabel label="State" />

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{
                  label: 'Select state',
                  value: null,
                }}
                value={state}
                onValueChange={setState}
                items={STATE_OPTIONS || []}
                useNativeAndroidPickerStyle={false}
                style={{
                  inputAndroid: styles.pickerInput,
                  inputIOS: styles.pickerInput,
                  placeholder: styles.pickerPlaceholder,
                  iconContainer: styles.pickerIconContainer,
                }}
                Icon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={21}
                    color={GOLD}
                  />
                )}
              />
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <FieldLabel label="City" />

                <TextInput
                  allowFontScaling={false}
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#8D8D8D"
                />
              </View>

              <View style={styles.column}>
                <FieldLabel label="Pincode" />

                <TextInput
                  allowFontScaling={false}
                  style={styles.input}
                  value={pincode}
                  onChangeText={text =>
                    setPincode(
                      text.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Pincode"
                  placeholderTextColor="#8D8D8D"
                />
              </View>
            </View>

            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <Ionicons
                    name="navigate"
                    size={20}
                    color="#000"
                  />
                </View>

                <View style={styles.locationTitleContent}>
                  <Text
                    allowFontScaling={false}
                    style={styles.locationTitle}
                  >
                    Current Salon Location
                  </Text>

                  <Text
                    allowFontScaling={false}
                    style={styles.locationSubtitle}
                  >
                    Location permission is compulsory
                  </Text>
                </View>
              </View>

              {locationLoading ? (
                <View style={styles.locationStatusCard}>
                  <ActivityIndicator
                    size="small"
                    color={GOLD}
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.locationStatusText}
                  >
                    Detecting location...
                  </Text>
                </View>
              ) : latitude !== null &&
                longitude !== null ? (
                <View
                  style={[
                    styles.locationStatusCard,
                    styles.locationSuccessCard,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={25}
                    color={GREEN}
                  />

                  <View style={styles.locationCoordinateContent}>
                    <Text
                      allowFontScaling={false}
                      style={styles.locationSuccessTitle}
                    >
                      Location Saved
                    </Text>

                    <Text
                      allowFontScaling={false}
                      style={styles.coordinateText}
                    >
                      {Number(latitude).toFixed(6)},{' '}
                      {Number(longitude).toFixed(6)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.locationStatusCard,
                    styles.locationWarningCard,
                  ]}
                >
                  <Ionicons
                    name="warning-outline"
                    size={24}
                    color="#FFB74D"
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.locationWarningText}
                  >
                    {locationError ||
                      'Current location is not available.'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.detectLocationButton}
                onPress={requestAndFetchLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons
                      name="locate"
                      size={21}
                      color="#000"
                    />

                    <Text
                      allowFontScaling={false}
                      style={styles.detectLocationText}
                    >
                      Detect Current Location
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* SALON IMAGES */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('images')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="images-outline"
                size={21}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <Text
                allowFontScaling={false}
                style={styles.sectionTitle}
              >
                Salon Images
              </Text>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                {salonImages.length} of {MAX_IMAGES} images added
              </Text>
            </View>
          </View>

          <View style={styles.sectionRight}>
            {salonImages.length < MAX_IMAGES ? (
              <TouchableOpacity
                style={styles.headerAddButton}
                onPress={event => {
                  event.stopPropagation?.();
                  addSalonImage();
                }}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>
            ) : null}

            <Ionicons
              name={
                visibleSections.images
                  ? 'chevron-up-circle'
                  : 'chevron-down-circle'
              }
              size={25}
              color={GOLD}
            />
          </View>
        </TouchableOpacity>

        {visibleSections.images ? (
          <View style={styles.sectionContent}>
            <Text
              allowFontScaling={false}
              style={styles.helperText}
            >
              The first image will be used as the main salon image.
            </Text>

            <View style={styles.imageGrid}>
              {salonImages.map((image, index) => (
                <View
                  key={`${image}-${index}`}
                  style={styles.imageGridItem}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      replaceSalonImage(index)
                    }
                  >
                    <Image
                      source={{
                        uri: buildImageUrl(image),
                      }}
                      style={styles.salonImage}
                    />

                    <View style={styles.imageEditIcon}>
                      <Ionicons
                        name="camera"
                        size={17}
                        color={WHITE}
                      />
                    </View>

                    {index === 0 ? (
                      <View style={styles.mainImageBadge}>
                        <Text
                          allowFontScaling={false}
                          style={styles.mainImageBadgeText}
                        >
                          Main
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      removeSalonImage(index)
                    }
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={WHITE}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {salonImages.length < MAX_IMAGES ? (
                <TouchableOpacity
                  style={styles.addImageCard}
                  onPress={addSalonImage}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={31}
                    color={GOLD}
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.addImageText}
                  >
                    Add Image
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {/* BUSINESS HOURS */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() =>
            toggleSection('businessHours')
          }
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="time-outline"
                size={22}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <Text
                allowFontScaling={false}
                style={styles.sectionTitle}
              >
                Business Hours
              </Text>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                {formatDisplayTime(openingTime)} –{' '}
                {formatDisplayTime(closingTime)}
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              visibleSections.businessHours
                ? 'chevron-up-circle'
                : 'chevron-down-circle'
            }
            size={25}
            color={GOLD}
          />
        </TouchableOpacity>

        {visibleSections.businessHours ? (
          <View style={styles.sectionContent}>
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <FieldLabel
                  label="Opening Time"
                  required
                />

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() =>
                    setPickerType('open')
                  }
                >
                  <Ionicons
                    name="sunny-outline"
                    size={20}
                    color={GOLD}
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.timeButtonText}
                  >
                    {formatDisplayTime(openingTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.column}>
                <FieldLabel
                  label="Closing Time"
                  required
                />

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() =>
                    setPickerType('close')
                  }
                >
                  <Ionicons
                    name="moon-outline"
                    size={20}
                    color={GOLD}
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.timeButtonText}
                  >
                    {formatDisplayTime(closingTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FieldLabel label="Weekly Off" />

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() =>
                setHolidayPickerVisible(
                  previous => !previous,
                )
              }
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.dropdownButtonText,
                  holiday === null &&
                    styles.placeholderText,
                ]}
              >
                {holiday !== null
                  ? DAYS.find(
                      day =>
                        String(day.value) ===
                        String(holiday),
                    )?.label || 'Selected day'
                  : 'No weekly off'}
              </Text>

              <Ionicons
                name={
                  holidayPickerVisible
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={21}
                color={GOLD}
              />
            </TouchableOpacity>

            {holidayPickerVisible ? (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setHoliday(null);
                    setHolidayPickerVisible(false);
                  }}
                >
                  <Ionicons
                    name={
                      holiday === null
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={
                      holiday === null ? GOLD : MUTED
                    }
                  />

                  <Text
                    allowFontScaling={false}
                    style={styles.dropdownOptionText}
                  >
                    No weekly off
                  </Text>
                </TouchableOpacity>

                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day.value}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setHoliday(day.value);
                      setHolidayPickerVisible(false);
                    }}
                  >
                    <Ionicons
                      name={
                        String(holiday) ===
                        String(day.value)
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={
                        String(holiday) ===
                        String(day.value)
                          ? GOLD
                          : MUTED
                      }
                    />

                    <Text
                      allowFontScaling={false}
                      style={styles.dropdownOptionText}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* SERVICES */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('services')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="cut-outline"
                size={22}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <View style={styles.titleWithCount}>
                <Text
                  allowFontScaling={false}
                  style={styles.sectionTitle}
                >
                  Salon Services
                </Text>

                <View style={styles.countBadge}>
                  <Text
                    allowFontScaling={false}
                    style={styles.countBadgeText}
                  >
                    {services.length}
                  </Text>
                </View>
              </View>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                Tap a service to edit its details
              </Text>
            </View>
          </View>

          <View style={styles.sectionRight}>
            <TouchableOpacity
              style={styles.headerAddButton}
              onPress={event => {
                event.stopPropagation?.();
                addService();
                setVisibleSections(previous => ({
                  ...previous,
                  services: true,
                }));
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color="#000"
              />
            </TouchableOpacity>

            <Ionicons
              name={
                visibleSections.services
                  ? 'chevron-up-circle'
                  : 'chevron-down-circle'
              }
              size={25}
              color={GOLD}
            />
          </View>
        </TouchableOpacity>

        {visibleSections.services ? (
          <View style={styles.sectionContent}>
            {genderType ? (
              <TouchableOpacity
                style={styles.defaultServicesButton}
                onPress={reloadDefaultServices}
              >
                <Ionicons
                  name="refresh"
                  size={19}
                  color={GOLD}
                />

                <Text
                  allowFontScaling={false}
                  style={styles.defaultServicesButtonText}
                >
                  Load Default {genderType} Services
                </Text>
              </TouchableOpacity>
            ) : null}

            {!services.length ? (
              <EmptyState
                icon="cut-outline"
                text="No services added."
              />
            ) : null}

            {services.map((service, index) => {
              const isExpanded =
                expandedServiceId === service.id;

              return (
                <View
                  key={service.id}
                  style={[
                    styles.compactItemCard,
                    isExpanded &&
                      styles.expandedItemCard,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.compactItemHeader}
                    onPress={() =>
                      toggleService(service.id)
                    }
                  >
                    <View style={styles.itemNumberBadge}>
                      <Text
                        allowFontScaling={false}
                        style={styles.itemNumberText}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.compactItemContent}>
                      <Text
                        allowFontScaling={false}
                        style={styles.compactItemTitle}
                        numberOfLines={1}
                      >
                        {service.name?.trim() ||
                          'Unnamed Service'}
                      </Text>

                      <Text
                        allowFontScaling={false}
                        style={styles.compactItemSubtitle}
                        numberOfLines={1}
                      >
                        ₹{service.price || '0'} •{' '}
                        {service.duration || '60'} min
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        isExpanded
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={21}
                      color={GOLD}
                    />
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.expandedItemContent}>
                      <FieldLabel label="Service Name" />

                      <TextInput
                        allowFontScaling={false}
                        style={styles.compactInput}
                        value={service.name}
                        onChangeText={text =>
                          updateService(
                            index,
                            'name',
                            text,
                          )
                        }
                        placeholder="Service name"
                        placeholderTextColor="#8D8D8D"
                      />

                      <View style={styles.twoColumnRow}>
                        <View style={styles.column}>
                          <FieldLabel label="Price" />

                          <TextInput
                            allowFontScaling={false}
                            style={styles.compactInput}
                            value={service.price}
                            onChangeText={text =>
                              updateService(
                                index,
                                'price',
                                text.replace(
                                  /[^0-9.]/g,
                                  '',
                                ),
                              )
                            }
                            keyboardType="decimal-pad"
                            placeholder="₹ Price"
                            placeholderTextColor="#8D8D8D"
                          />
                        </View>

                        <View style={styles.column}>
                          <FieldLabel label="Duration" />

                          <TextInput
                            allowFontScaling={false}
                            style={styles.compactInput}
                            value={service.duration}
                            onChangeText={text =>
                              updateService(
                                index,
                                'duration',
                                text.replace(/\D/g, ''),
                              )
                            }
                            keyboardType="number-pad"
                            placeholder="Minutes"
                            placeholderTextColor="#8D8D8D"
                          />
                        </View>
                      </View>

                      <FieldLabel label="Description" />

                      <TextInput
                        allowFontScaling={false}
                        style={[
                          styles.compactInput,
                          styles.compactTextArea,
                        ]}
                        value={service.description}
                        onChangeText={text =>
                          updateService(
                            index,
                            'description',
                            text,
                          )
                        }
                        placeholder="Optional description"
                        placeholderTextColor="#8D8D8D"
                        multiline
                        textAlignVertical="top"
                      />

                      <TouchableOpacity
                        style={styles.deleteItemButton}
                        onPress={() =>
                          removeService(service.id)
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={RED}
                        />

                        <Text
                          allowFontScaling={false}
                          style={styles.deleteItemText}
                        >
                          Remove Service
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.bottomAddButton}
              onPress={addService}
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#000"
              />

              <Text
                allowFontScaling={false}
                style={styles.bottomAddButtonText}
              >
                Add New Service
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* BARBERS */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sectionHeader}
          onPress={() => toggleSection('barbers')}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <Ionicons
                name="people-outline"
                size={22}
                color="#000"
              />
            </View>

            <View style={styles.sectionTitleContent}>
              <View style={styles.titleWithCount}>
                <Text
                  allowFontScaling={false}
                  style={styles.sectionTitle}
                >
                  Barbers
                </Text>

                <View style={styles.countBadge}>
                  <Text
                    allowFontScaling={false}
                    style={styles.countBadgeText}
                  >
                    {barbers.length}
                  </Text>
                </View>
              </View>

              <Text
                allowFontScaling={false}
                style={styles.sectionSubtitle}
              >
                Tap a barber to edit details
              </Text>
            </View>
          </View>

          <View style={styles.sectionRight}>
            <TouchableOpacity
              style={styles.headerAddButton}
              onPress={event => {
                event.stopPropagation?.();
                addBarber();
                setVisibleSections(previous => ({
                  ...previous,
                  barbers: true,
                }));
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color="#000"
              />
            </TouchableOpacity>

            <Ionicons
              name={
                visibleSections.barbers
                  ? 'chevron-up-circle'
                  : 'chevron-down-circle'
              }
              size={25}
              color={GOLD}
            />
          </View>
        </TouchableOpacity>

        {visibleSections.barbers ? (
          <View style={styles.sectionContent}>
            {!barbers.length ? (
              <EmptyState
                icon="person-add-outline"
                text="No barber added."
              />
            ) : null}

            {barbers.map((barber, index) => {
              const isExpanded =
                expandedBarberId === barber.id;

              return (
                <View
                  key={barber.id}
                  style={[
                    styles.compactItemCard,
                    isExpanded &&
                      styles.expandedItemCard,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.compactBarberHeader}
                    onPress={() =>
                      toggleBarber(barber.id)
                    }
                  >
                    <Image
                      source={
                        barber.image
                          ? {
                              uri: buildImageUrl(
                                barber.image,
                              ),
                            }
                          : require('../assets/my_naai.png')
                      }
                      style={styles.compactBarberImage}
                    />

                    <View style={styles.compactItemContent}>
                      <Text
                        allowFontScaling={false}
                        style={styles.compactItemTitle}
                        numberOfLines={1}
                      >
                        {barber.name?.trim() ||
                          `Barber ${index + 1}`}
                      </Text>

                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.barberStatusText,
                          {
                            color:
                              barber.isAvailable !== false
                                ? '#81C784'
                                : '#EF9A9A',
                          },
                        ]}
                      >
                        {barber.isAvailable !== false
                          ? 'Available'
                          : 'On Leave'}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        isExpanded
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={21}
                      color={GOLD}
                    />
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.expandedItemContent}>
                      <View style={styles.barberEditRow}>
                        <TouchableOpacity
                          style={styles.barberImageButton}
                          onPress={() =>
                            pickImage(uri =>
                              updateBarber(
                                index,
                                'image',
                                uri,
                              ),
                            )
                          }
                        >
                          <Image
                            source={
                              barber.image
                                ? {
                                    uri: buildImageUrl(
                                      barber.image,
                                    ),
                                  }
                                : require('../assets/my_naai.png')
                            }
                            style={styles.barberEditImage}
                          />

                          <View style={styles.cameraBadge}>
                            <Ionicons
                              name="camera"
                              size={14}
                              color="#000"
                            />
                          </View>
                        </TouchableOpacity>

                        <View style={styles.barberNameContainer}>
                          <FieldLabel label="Barber Name" />

                          <TextInput
                            allowFontScaling={false}
                            style={styles.compactInput}
                            value={barber.name}
                            onChangeText={text =>
                              updateBarber(
                                index,
                                'name',
                                text,
                              )
                            }
                            placeholder="Barber name"
                            placeholderTextColor="#8D8D8D"
                          />
                        </View>
                      </View>

                      <FieldLabel label="Availability" />

                      <View style={styles.availabilityRow}>
                        <TouchableOpacity
                          style={[
                            styles.availabilityButton,
                            barber.isAvailable &&
                              styles.availableButtonActive,
                          ]}
                          onPress={() =>
                            updateBarber(
                              index,
                              'isAvailable',
                              true,
                            )
                          }
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={19}
                            color={
                              barber.isAvailable
                                ? '#000'
                                : MUTED
                            }
                          />

                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.availabilityText,
                              barber.isAvailable &&
                                styles.activeAvailabilityText,
                            ]}
                          >
                            Available
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.availabilityButton,
                            !barber.isAvailable &&
                              styles.leaveButtonActive,
                          ]}
                          onPress={() =>
                            updateBarber(
                              index,
                              'isAvailable',
                              false,
                            )
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={19}
                            color={
                              !barber.isAvailable
                                ? WHITE
                                : MUTED
                            }
                          />

                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.availabilityText,
                              !barber.isAvailable &&
                                styles.leaveAvailabilityText,
                            ]}
                          >
                            On Leave
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteItemButton}
                        onPress={() =>
                          removeBarber(barber.id)
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={RED}
                        />

                        <Text
                          allowFontScaling={false}
                          style={styles.deleteItemText}
                        >
                          Remove Barber
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.bottomAddButton}
              onPress={addBarber}
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color="#000"
              />

              <Text
                allowFontScaling={false}
                style={styles.bottomAddButtonText}
              >
                Add New Barber
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>

    {/* FLOATING UPDATE BUTTON */}
    <View style={styles.floatingSaveContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.floatingSaveButton,
          saving && styles.disabledButton,
        ]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        {saving ? (
          <>
            <ActivityIndicator
              size="small"
              color="#000"
            />

            <Text
              allowFontScaling={false}
              style={styles.floatingSaveText}
            >
              Updating Profile...
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#000"
            />

            <Text
              allowFontScaling={false}
              style={styles.floatingSaveText}
            >
              {isOnboarding
                ? 'Save and Continue'
                : 'Update Salon Profile'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>

    {/* TIME PICKER */}
    {pickerType ? (
      <DateTimePicker
        value={
          pickerType === 'open'
            ? openingTime
            : closingTime
        }
        mode="time"
        is24Hour={false}
        display={
          Platform.OS === 'ios'
            ? 'spinner'
            : 'default'
        }
        onChange={(event, selectedDate) => {
          if (Platform.OS === 'android') {
            setPickerType(null);
          }

          if (!selectedDate) {
            return;
          }

          if (pickerType === 'open') {
            setOpeningTime(selectedDate);
          } else {
            setClosingTime(selectedDate);
          }

          if (Platform.OS === 'ios') {
            setPickerType(null);
          }
        }}
      />
    ) : null}
  </SafeAreaView>
);
};

const FieldLabel = ({
  label,
  required = false,
}) => (
  <Text
    allowFontScaling={false}
    style={styles.fieldLabel}
  >
    {label}

    {required ? (
      <Text style={styles.required}> *</Text>
    ) : null}
  </Text>
);

const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionTitleContainer}>
    <View style={styles.sectionIconContainer}>
      <Ionicons
        name={icon}
        size={23}
        color="#000"
      />
    </View>

    <Text
      allowFontScaling={false}
      style={styles.sectionTitle}
    >
      {title}
    </Text>
  </View>
);

const SectionHeader = ({
  icon,
  title,
  buttonLabel,
  onPress,
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionIconContainer}>
        <Ionicons
          name={icon}
          size={23}
          color="#000"
        />
      </View>

      <Text
        allowFontScaling={false}
        style={styles.sectionTitle}
      >
        {title}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.smallAddButton}
      onPress={onPress}
    >
      <Ionicons
        name="add-circle"
        size={19}
        color="#000"
      />

      <Text
        allowFontScaling={false}
        style={styles.smallAddButtonText}
      >
        {buttonLabel}
      </Text>
    </TouchableOpacity>
  </View>
);

const EmptyState = ({ icon, text }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons
        name={icon}
        size={30}
        color={GOLD}
      />
    </View>

    <Text
      allowFontScaling={false}
      style={styles.emptyStateText}
    >
      {text}
    </Text>
  </View>
);

export default EditSalonProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },

  loaderContainer: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  loaderTitle: {
    color: WHITE,
    marginTop: 15,
    fontSize: 18,
    fontWeight: '800',
  },

  loaderText: {
    color: MUTED,
    marginTop: 7,
    fontSize: 13,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 10,
  },

  headerIconButton: {
    width: 41,
    height: 41,
    borderRadius: 21,
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerPlaceholder: {
    width: 41,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  headerSubtitle: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
    maxWidth: '90%',
  },

  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 130,
  },

  sectionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
    overflow: 'hidden',
  },

  sectionHeader: {
    minHeight: 70,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },

  sectionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitleContent: {
    flex: 1,
    marginLeft: 10,
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#AFAFAF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },

  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  sectionContent: {
    paddingHorizontal: 13,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#303030',
  },

  headerAddButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countBadge: {
    minWidth: 25,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#333333',
    marginLeft: 8,
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },

  countBadgeText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
  },

  fieldLabel: {
    color: '#ECECEC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 13,
  },

  required: {
    color: '#FF5252',
  },

  input: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: BORDER,
  },

  compactInput: {
    minHeight: 45,
    backgroundColor: INPUT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: WHITE,
    fontSize: 13,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: BORDER,
  },

  compactTextArea: {
    minHeight: 67,
    paddingTop: 11,
  },

  addressTextArea: {
    minHeight: 84,
    paddingTop: 12,
  },

  phoneContainer: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },

  countryCode: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '900',
    marginRight: 9,
    paddingRight: 9,
    borderRightWidth: 1,
    borderRightColor: '#555',
  },

  phoneInput: {
    flex: 1,
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },

  pickerContainer: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
  },

  pickerInput: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 13,
    paddingVertical: 14,
    paddingRight: 42,
  },

  pickerPlaceholder: {
    color: '#929292',
  },

  pickerIconContainer: {
    top: 14,
    right: 13,
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 9,
  },

  column: {
    flex: 1,
  },

  locationContainer: {
    marginTop: 18,
    backgroundColor: '#202020',
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: '#383838',
  },

  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  locationIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationTitleContent: {
    flex: 1,
    marginLeft: 9,
  },

  locationTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
  },

  locationSubtitle: {
    color: '#AFAFAF',
    fontSize: 10,
    marginTop: 2,
  },

  locationStatusCard: {
    minHeight: 59,
    borderRadius: 11,
    backgroundColor: '#292929',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationStatusText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 9,
  },

  locationSuccessCard: {
    backgroundColor: '#17351F',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },

  locationWarningCard: {
    backgroundColor: '#392A16',
    borderWidth: 1,
    borderColor: '#795548',
  },

  locationCoordinateContent: {
    flex: 1,
    marginLeft: 9,
  },

  locationSuccessTitle: {
    color: '#A5D6A7',
    fontSize: 13,
    fontWeight: '900',
  },

  coordinateText: {
    color: '#E8F5E9',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  locationWarningText: {
    flex: 1,
    color: '#FFE0B2',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginLeft: 9,
  },

  detectLocationButton: {
    minHeight: 45,
    marginTop: 10,
    backgroundColor: GOLD,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detectLocationText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 7,
  },

  helperText: {
    color: '#BEBEBE',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    marginBottom: 13,
  },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },

  imageGridItem: {
    width: '47.5%',
    aspectRatio: 1.2,
    position: 'relative',
  },

  salonImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: '#333',
  },

  imageEditIcon: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainImageBadge: {
    position: 'absolute',
    left: 7,
    top: 7,
    backgroundColor: GOLD,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  mainImageBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },

  removeImageButton: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: RED,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addImageCard: {
    width: '47.5%',
    aspectRatio: 1.2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderStyle: 'dashed',
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addImageText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },

  timeButton: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },

  timeButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 7,
  },

  dropdownButton: {
    minHeight: 48,
    backgroundColor: INPUT,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
  },

  placeholderText: {
    color: '#929292',
  },

  dropdownMenu: {
    backgroundColor: '#242424',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#444',
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  dropdownOption: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#363636',
  },

  dropdownOptionText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 9,
  },

  defaultServicesButton: {
    minHeight: 43,
    backgroundColor: '#292929',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: GOLD,
    marginTop: 12,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  defaultServicesButtonText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
  },

  compactItemCard: {
    backgroundColor: '#222222',
    borderRadius: 12,
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#343434',
    overflow: 'hidden',
  },

  expandedItemCard: {
    borderColor: '#665235',
  },

  compactItemHeader: {
    minHeight: 60,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  compactBarberHeader: {
    minHeight: 64,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemNumberBadge: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemNumberText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },

  compactItemContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  compactItemTitle: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },

  compactItemSubtitle: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  expandedItemContent: {
    paddingHorizontal: 11,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#343434',
  },

  deleteItemButton: {
    minHeight: 40,
    marginTop: 13,
    borderRadius: 10,
    backgroundColor: '#371B1B',
    borderWidth: 1,
    borderColor: '#632929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteItemText: {
    color: '#FF8A80',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },

  bottomAddButton: {
    minHeight: 43,
    marginTop: 12,
    borderRadius: 11,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomAddButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 6,
  },

  compactBarberImage: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: '#333',
  },

  barberStatusText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },

  barberEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 3,
  },

  barberImageButton: {
    position: 'relative',
    marginRight: 11,
    marginBottom: 1,
  },

  barberEditImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: '#333',
  },

  cameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  barberNameContainer: {
    flex: 1,
  },

  availabilityRow: {
    flexDirection: 'row',
    gap: 8,
  },

  availabilityButton: {
    flex: 1,
    minHeight: 41,
    borderRadius: 10,
    backgroundColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },

  availableButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  leaveButtonActive: {
    backgroundColor: RED,
    borderColor: RED,
  },

  availabilityText: {
    color: '#D0D0D0',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  activeAvailabilityText: {
    color: '#000',
  },

  leaveAvailabilityText: {
    color: WHITE,
  },

  emptyState: {
    backgroundColor: '#222222',
    borderRadius: 12,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 11,
    borderWidth: 1,
    borderColor: '#343434',
  },

  emptyIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyStateText: {
    color: '#C2C2C2',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },

  floatingSaveContainer: {
    position: 'absolute',
    left: 13,
    right: 13,
    bottom: Platform.OS === 'ios' ? 12 : 10,
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(16,16,16,0.94)',
    borderWidth: 1,
    borderColor: '#343434',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
  },

  floatingSaveButton: {
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingSaveText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  bottomSpace: {
    height: 20,
  },
});