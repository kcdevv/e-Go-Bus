import { database } from '../../../firebase.config'; // Ensure this path is correct
import { ref as dbRef, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
const getPickupPointsData = async () => {
  try {
    // Retrieve stored IDs from AsyncStorage
    const schoolID = await AsyncStorage.getItem('schoolID');
    const busID = await AsyncStorage.getItem('busID');
    const tripID = await AsyncStorage.getItem('tripID');
    if (!schoolID || !busID || !tripID) {
      throw new Error('Missing data in AsyncStorage');
    }
    // Reference to the pickupPoints in the database
    const pickupPointsRef = dbRef(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);
    // Fetch data from Firebase Realtime Database
    const snapshot = await get(pickupPointsRef);
    if (snapshot.exists()) {
      return snapshot.val(); 
    } else {
      throw new Error('No pickup points found for this trip');
    }
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    throw error; // Optionally, handle this error in the component
  }
};
export { getPickupPointsData };