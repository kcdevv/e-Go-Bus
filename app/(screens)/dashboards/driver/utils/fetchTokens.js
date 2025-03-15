import { database } from "../../../../../firebase.config";
import { ref as dbRef, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const fetchTokens = async () => {
  try {
    // Retrieve schoolID, busID, and tripType from AsyncStorage
    const schoolID = await AsyncStorage.getItem("schoolID");
    const busID = await AsyncStorage.getItem("busID");
    const tripID = await AsyncStorage.getItem("tripSelected");

    // Validate required data
    if (!schoolID || !busID || !tripID) {
      throw new Error("Missing data in AsyncStorage");
    }

    // Reference to the pickup points in the Firebase database
    const tokensRef = dbRef(
      database,
      `schools/${schoolID}/buses/${busID}/trips/${tripID}/tokens`
    );
    const snapshot = await get(tokensRef);

    // Check if data exists
    if (snapshot.exists()) {
      let tokens = snapshot.val();
      return tokens;
    } else {
      console.warn("No tokens found for tripID:", tripID);
      throw new Error("No tokens found for this trip");
    }
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    throw error;
  }
};

const fetchTokensAtPickup = () => {

}


export { fetchTokens };
