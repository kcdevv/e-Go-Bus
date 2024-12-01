import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../../../firebase.config"; // Adjust the path as needed
import { ref as dbRef, update, get, set } from "firebase/database";
import Constants from "expo-constants";

const registerDeviceToken = async (schoolID, studentID, busID, tripID) => {
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
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    if (!token) {
      throw new Error("Failed to generate device token");
    }

    // Retrieve the stored token
    const storedToken = await AsyncStorage.getItem("deviceToken");

    // Check if the token has changed
    if (storedToken !== token) {
      // Save the new token locally
      await AsyncStorage.setItem("deviceToken", token);

      // Update the token in Firebase
      const db = database;
      const studentRef = dbRef(
        db,
        `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`
      );

      // Check if the student node exists
      const studentSnapshot = await get(studentRef);
      if (!studentSnapshot.exists()) {
        // Use set if the node doesn't exist
        await set(studentRef, { token });
        console.log("Student node created with token:", token);
      } else {
        // Use update to avoid overwriting other properties
        await update(studentRef, { token });
        console.log("Device token updated in existing student node:", token);
      }
    } else {
      console.log('token: ' + token);
      console.log("Device token unchanged, no update required.");
    }

    return token;
  } catch (error) {
    console.error("Error registering device token:", error);
    throw error;
  }
};


export default registerDeviceToken;
