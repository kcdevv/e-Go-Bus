import { database } from '../../../firebase.config'; 
import { ref as dbRef, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getPickupPointsData = async () => {
  try {
    const schoolID = await AsyncStorage.getItem('schoolID');
    const busID = await AsyncStorage.getItem('busID');
    const tripID = await AsyncStorage.getItem('tripID');

    console.log('schoolID:', schoolID, 'busID:', busID, 'tripID:', tripID); // Debugging logs

    if (!schoolID || !busID || !tripID) {
      throw new Error('Missing data in AsyncStorage');
    }

    const pickupPointsRef = dbRef(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);
    const snapshot = await get(pickupPointsRef);

    console.log('Firebase Snapshot:', snapshot.exists() ? snapshot.val() : 'No data found'); // Log the entire snapshot

    if (snapshot.exists()) {
      const pickupPoints = snapshot.val();
      const pickupPointsArray = Array.isArray(pickupPoints) ? pickupPoints : Object.values(pickupPoints);

      const unpackedPickupPoints = pickupPointsArray.map(pickupPoint => ({
        ...pickupPoint, 
        students: pickupPoint.students.map(student => ({ ...student }))
      }));

      await AsyncStorage.setItem('pickupPoints', JSON.stringify(unpackedPickupPoints));
      console.log('Stored Pickup Points:', unpackedPickupPoints); // Log what is being stored
      return unpackedPickupPoints; 
    } else {
      throw new Error('No pickup points found for this trip');
    }
  } catch (error) {
    console.error("Error fetching pickup points:", error);
    throw error; 
  }
};

export { getPickupPointsData };
getPickupPointsData();