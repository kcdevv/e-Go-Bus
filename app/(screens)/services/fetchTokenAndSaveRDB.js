import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default registerDeviceToken = async () => {
  // Request permissions for notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  });
  let finalStatus = existingStatus;

  // Only ask if permissions have not already been determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Stop here if the user did not grant permissions
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  // Get the token that uniquely identifies this device
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);

  // You can now send this token to your server or save it in your database
  return token;
};