import * as Notifications from 'expo-notifications';

export const sendNotification = async (message) => {
  try {
    // Get the Expo Push Token
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    console.log('Expo Push Token:', token);

    // Set notification handler (if not already set elsewhere)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Send the notification to your server
    const response = await fetch(
      'https://us-central1-egobus-5be34.cloudfunctions.net/sendExpoNotification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token, // Use the retrieved token
          title: 'Test Notification',
          body: message,
        }),
      }
    );

    const result = await response.json();
    console.log('Notification response:', result);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
