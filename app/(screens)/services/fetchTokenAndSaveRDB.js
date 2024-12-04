import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../../../firebase.config"; // Adjust the path if needed
import { ref as dbRef, update, get, set } from "firebase/database";
import Constants from "expo-constants";
import { Alert } from "react-native";

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

      const studentRef = dbRef(
        database,
        `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`
      );

      const studentSnapshot = await get(studentRef);

      if (!studentSnapshot.exists()) {
        // Create the node if it doesn't exist
        await set(studentRef, { token });
      } else {
        // Update the existing node without overwriting other properties
        await update(studentRef, { token });
      }
    }

    return token;
  } catch (error) {
    Alert.alert("Registration Failed", error.message);
    throw error;
  }
};

export default registerDeviceToken;
