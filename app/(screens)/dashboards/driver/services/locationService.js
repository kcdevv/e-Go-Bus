import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { ref, set, serverTimestamp, get } from "firebase/database";

// Load stored data from AsyncStorage
export const loadStoredData = async () => {
  try {
    const [storedBusId, storedSchoolId, storedDriverId, storedTripNumber] = await Promise.all([
      AsyncStorage.getItem("busID"),
      AsyncStorage.getItem("schoolID"),
      AsyncStorage.getItem("driverID"),
      AsyncStorage.getItem("tripID"),
    ]);

    if (storedBusId && storedSchoolId && storedDriverId && storedTripNumber) {
      return {
        busId: storedBusId,
        schoolId: storedSchoolId,
        driverId: storedDriverId,
        tripNumber: storedTripNumber,
      };
    }
    return null;
  } catch (error) {
    console.error("Error retrieving data from AsyncStorage:", error);
    return null;
  }
};

// Request and retrieve location asynchronously
export const getLocationAsync = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission not granted");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      timeout: 5000,
      maximumAge: 1000,
    });

    return location;
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
};

// Update Firebase with location data
export const updateFirebaseData = async (database, data) => {
  const { busId, schoolId, driverId, tripNumber, location, heading } = data;

  if (!busId || !schoolId || !tripNumber || !location) {
    console.warn("Missing required parameters for Firebase update:", {
      busId, schoolId, tripNumber, location,
    });
    return;
  }

  try {
    const locationRef = ref(
      database,
      `schools/${schoolId}/buses/${busId}/trips/${tripNumber}/location`
    );

    const locationData = {
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      accuracy: location?.coords?.accuracy,
      heading: heading || 0,
      timestamp: Date.now(),
    };

    // Only update if data has changed
    const snapshot = await get(locationRef);
    if (!snapshot.exists() || JSON.stringify(snapshot.val()) !== JSON.stringify(locationData)) {
      await set(locationRef, locationData);
      console.log("Location successfully updated in Firebase.");
    }
  } catch (error) {
    console.error("Error updating Firebase location:", error);
    throw new Error("Failed to update location in Firebase");
  }
};