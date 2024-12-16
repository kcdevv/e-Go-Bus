import { database } from "../../../firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref as dbRef, get } from "firebase/database";

export const countTripsAndStore = async (schoolID, busID) => {
  try {
    // Reference to the trips node
    const tripsRef = dbRef(database, `schools/${schoolID}/buses/${busID}/trips`);
    
    // Fetch data from Firebase
    const tripsSnapshot = await get(tripsRef);
    
    if (tripsSnapshot.exists()) {
      // Count the number of trips
      const noOfTrips = Object.keys(tripsSnapshot.val()).length;

      // Store the count in AsyncStorage
      await AsyncStorage.setItem("noOfTrips", JSON.stringify(noOfTrips));
      console.log(`Trips count (${noOfTrips}) stored successfully.`);
    } else {
      console.log("No trips found for the given schoolID and busID.");
    }
  } catch (error) {
    console.error("Error counting trips or storing in AsyncStorage:", error);
  }
};

