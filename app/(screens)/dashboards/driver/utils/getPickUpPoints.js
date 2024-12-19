import { database } from '../../../../../firebase.config'; 
import { ref as dbRef, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getPickupPointsData = async (tripID) => {
  try {
    const schoolID = await AsyncStorage.getItem('schoolID');
    const busID = await AsyncStorage.getItem('busID');

    if (!schoolID || !busID || !tripID) {
      throw new Error('Missing data in AsyncStorage');
    }
    
    const pickupPointsRef = dbRef(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);
    console.log(`schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);
    const snapshot = await get(pickupPointsRef);

    if (snapshot.exists()) {
      console.log("hello", snapshot.val());
      return snapshot.val();
    } else {
      console.warn("No pickup points found for tripID:", tripID);
      throw new Error('No pickup points found for this trip');
    }
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    throw error;
  }
};


export { getPickupPointsData };
