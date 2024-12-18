import { Animated, Easing, Platform } from "react-native";
import { updateFirebaseData } from "../services/locationService";

// Function to calculate heading
export const calculateHeading = (magnetometerData) => {
  const { x, y } = magnetometerData;

  if (x === undefined || y === undefined) {
    console.warn("Magnetometer data is not available yet");
    return null;
  }

  // Calculate angle from magnetometer data
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  angle = angle < 0 ? angle + 360 : angle; // Ensure positive angle
  console.log("Calculated Heading:", angle);
  return angle;
};

// Function to rotate the marker smoothly
export const rotateMarker = (rotationValue, currentHeading) => {
  Animated.timing(rotationValue, {
    toValue: currentHeading - 90, // Correct the heading for orientation
    duration: 300,
    useNativeDriver: Platform.OS !== "web",
    easing: Easing.linear,
  }).start();
};

// Function to update Firebase with location and heading
export const updateFirebase = async (database, busId, schoolId, tripId, location, currentHeading) => {
  if (!busId || !schoolId || !tripId) {
    console.warn("Missing trip details for Firebase update");
    return;
  }

  try {
    await updateFirebaseData(database, {
      busId,
      schoolId,
      tripId,
      location,
      heading: currentHeading,
    });
    console.log("Firebase updated successfully");
  } catch (error) {
    console.error("Failed to update Firebase:", error);
    throw error;
  }
};