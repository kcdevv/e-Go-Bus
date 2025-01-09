import { database } from "../../../../../firebase.config";
import { ref as dbRef, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getPickupPointsData = async (tripID) => {
  try {
    // Retrieve schoolID, busID, and tripType from AsyncStorage
    const schoolID = await AsyncStorage.getItem("schoolID");
    const busID = await AsyncStorage.getItem("busID");
    const tripType = await AsyncStorage.getItem("tripType"); // Fetch trip type

    // Validate required data
    if (!schoolID || !busID || !tripID || !tripType) {
      throw new Error("Missing data in AsyncStorage");
    }

    console.log("Trip ID:", tripID);
    console.log("Trip Type:", tripType);

    // Reference to the pickup points in the Firebase database
    const pickupPointsRef = dbRef(
      database,
      `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`
    );
    const snapshot = await get(pickupPointsRef);

    // Check if data exists
    if (snapshot.exists()) {
      let pickupPoints = snapshot.val();

      // Reverse the order for "Dropping" trip type
      if (tripType.toLowerCase() === "dropping") {
        // Convert object to array, reverse it, and then back to object
        pickupPoints.reverse();
      }

      console.log("Pickup Points:", pickupPoints);
      return pickupPoints;
    } else {
      console.warn("No pickup points found for tripID:", tripID);
      throw new Error("No pickup points found for this trip");
    }
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    throw error;
  }
};


export { getPickupPointsData };
