// import messaging from '@react-native-firebase/messaging';
// import { getDatabase, ref, update } from 'firebase/database';
// import { Alert } from 'react-native';

// // Fetch and store FCM device token
// export const registerDeviceToken = async (studentID, schoolID, busID, tripID) => {
//   try {
//     // Step 1: Custom Explanation Dialog
//     const userConsent = await new Promise((resolve) => {
//       Alert.alert(
//         "Enable Notifications",
//         "e-Go Bus uses notifications to send you important updates, like trip alerts, school notifications, or missing items. Please allow notifications to stay informed.",
//         [
//           { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
//           { text: "Allow", onPress: () => resolve(true) },
//         ]
//       );
//     });

//     if (!userConsent) {
//       console.log("User denied the custom explanation for notifications.");
//       return; // Exit if the user declines the custom dialog
//     }

//     // Step 2: Request Notification Permissions
//     const authStatus = await messaging().requestPermission();
//     const enabled =
//       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//       authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//     if (!enabled) {
//       console.error("Notifications permission not granted by the user.");
//       throw new Error("Failed to get FCM token for notifications!");
//     }

//     // Step 3: Get the FCM Token
//     const fcmToken = await messaging().getToken();

//     if (!fcmToken) {
//       throw new Error("Failed to retrieve FCM token.");
//     }

//     console.log("FCM Token:", fcmToken);

//     // Step 4: Store the FCM Token in Firebase Realtime Database
//     const db = getDatabase();
//     const tokenPath = `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`;
//     await update(ref(db, tokenPath), {
//       token: fcmToken,
//     });

//     console.log(`FCM token stored successfully at: ${tokenPath}`);
//   } catch (error) {
//     console.error("Error fetching or storing the FCM token:", error);
//     throw error;
//   }
// };
