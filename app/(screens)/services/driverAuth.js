import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../firebase.config';
import { ref as dbRef, get, update, set } from 'firebase/database';
import { Alert } from 'react-native';
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";


// Validate driver credentials against Firebase Database
export const validateDriver = async (schoolID, busID) => {
  const db = database;
  try {
    const schoolSnapshot = await get(dbRef(db, `schools/${schoolID}`));
    const busSnapshot = await get(dbRef(db, `schools/${schoolID}/buses/${busID}`));

    if (!schoolSnapshot.exists()) {
      Alert.alert('Error', 'School ID does not exist');
      return false;
    }
    if (!busSnapshot.exists()) {
      Alert.alert('Error', 'Bus ID does not exist');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating driver:', error);
    Alert.alert('Error', 'Failed to validate driver credentials');
    return false;
  }
};

// Store driver details in AsyncStorage
export const storeDriverDetails = async (schoolID, busID, driverID) => {
  try {
    const driverRef = dbRef(database, `schools/${schoolID}/buses/${busID}/driver`);
    const schoolRef = dbRef(database, `schools/${schoolID}`);
    const busRef = dbRef(database, `schools/${schoolID}/buses/${busID}`);

    const [driverSnapshot, schoolSnapshot, busSnapshot] = await Promise.all([
      get(driverRef),
      get(schoolRef),
      get(busRef)
    ]);

    if (driverSnapshot.exists()) {
      const driverDetails = driverSnapshot.val();
      const schoolName = schoolSnapshot.val()?.schoolName;
      const busDetails = busSnapshot.val();

      // Remove sensitive or unnecessary data
      const { trips, ...filteredBusDetails } = busDetails;

      await AsyncStorage.setItem('driverDetails', JSON.stringify(driverDetails));
      await AsyncStorage.setItem('schoolName', JSON.stringify(schoolName));
      await AsyncStorage.setItem('busDetails', JSON.stringify(filteredBusDetails));

      return {
        driverDetails,
        schoolName,
        busDetails: filteredBusDetails
      };
    }
    return null;
  } catch (error) {
    console.error('Error storing driver details:', error);
    throw error;
  }
};

// Count trips and store in AsyncStorage
export const countTripsAndStore = async (schoolID, busID) => {
  try {
    const tripsRef = dbRef(database, `schools/${schoolID}/buses/${busID}/trips`);
    const tripsSnapshot = await get(tripsRef);
    
    if (tripsSnapshot.exists()) {
      const tripsData = tripsSnapshot.val();
      const noOfTrips = Object.keys(tripsData).length;
      
      // Store trips data and count
      await AsyncStorage.setItem('tripsData', JSON.stringify(tripsData));
      await AsyncStorage.setItem('noOfTrips', JSON.stringify(noOfTrips));
      
      return {
        tripsData,
        noOfTrips
      };
    }
    
    await AsyncStorage.setItem('noOfTrips', '0');
    return {
      tripsData: {},
      noOfTrips: 0
    };
  } catch (error) {
    console.error('Error counting trips:', error);
    throw error;
  }
};

// Update driver's device token
export const updateDriverToken = async (schoolID, busID, driverID, deviceToken) => {
  try {
    const driverRef = dbRef(database, `schools/${schoolID}/buses/${busID}/driver`);
    
    await update(driverRef, {
      token: deviceToken
    });

    return true;
  } catch (error) {
    console.error('Error updating driver token:', error);
    throw error;
  }
};

export const registerDriverToken = async (schoolID, driverID, busID) => {
  try {
    // Request notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        throw new Error("Notification permissions not granted");
      }
    }

    // Generate the device token
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })
    ).data;

    if (!token) throw new Error("Failed to generate device token");

    // Retrieve the stored token
    const storedToken = await AsyncStorage.getItem("deviceToken");

    // Update Firebase only if the token has changed
    if (storedToken !== token) {
      await AsyncStorage.setItem("deviceToken", token);

      const driverRef = dbRef(
        database,
        `schools/${schoolID}/buses/${busID}`
      );

      const driverSnapshot = await get(driverRef);

      if (!driverSnapshot.exists()) {
        // Create the node if it doesn't exist
        await set(driverRef, { token });
      } else {
        // Update the existing node without overwriting other properties
        await update(driverRef, { token });
      }
    }

    return token;
  } catch (error) {
    Alert.alert("Registration Failed", error.message);
    throw error;
  }
};
