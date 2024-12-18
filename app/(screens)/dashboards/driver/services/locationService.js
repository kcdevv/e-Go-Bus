import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { ref, set, serverTimestamp, get } from "firebase/database";

// Load stored data from AsyncStorage
export const loadStoredData = async () => {
  try {
    const [storedBusId, storedSchoolId, storedDriverId, noOfTripsStr] = await Promise.all([
      AsyncStorage.getItem("busID"),
      AsyncStorage.getItem("schoolID"),
      AsyncStorage.getItem("driverID"),
      AsyncStorage.getItem("noOfTrips"),  // Get the stored value directly
    ]);

    // Safely parse `noOfTrips` only if it's valid
    const noOfTrips = noOfTripsStr ? JSON.parse(noOfTripsStr) : 0;

    if (storedBusId && storedSchoolId && storedDriverId && noOfTrips !== null) {
      return {
        busId: storedBusId,
        schoolId: storedSchoolId,
        driverId: storedDriverId,
        noOfTrips: noOfTrips,
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
    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      throw new Error("Foreground location permission not granted");
    }

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      throw new Error("Background location permission not granted");
    }

    // Both permissions granted, retrieve current location
    if (foregroundStatus === "granted" && backgroundStatus === "granted") {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 5000,
        maximumAge: 1000,
      });

      return location;
    } else {
      throw new Error("Required permissions not granted");
    }
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
};

// Update Firebase with location data
export const updateFirebaseData = async (database, data) => {
  const { busId, schoolId, tripId, location, heading } = data;

  if (!busId || !schoolId || !tripId || !location) {
    console.warn("Missing required parameters for Firebase update:", {
      busId, schoolId, tripId, location
    });
    return;
  }

  try {
    const locationRef = ref(
      database,
      `schools/${schoolId}/buses/${busId}/trips/${tripId}/location`
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
      console.log("Location successfully updated in Firebase");
    }
  } catch (error) {
    console.error("Error updating Firebase location:", error);
    throw new Error("Failed to update location in Firebase");
  }
};