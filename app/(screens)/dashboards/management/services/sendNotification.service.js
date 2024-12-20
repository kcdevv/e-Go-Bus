import axios from 'axios'

export const sendNotificationToParents = async (message) => {
  try {
    const tokens = [
      "ExponentPushToken[Qgx113E9yyNHoEXEJVEFrj]",
      "ExponentPushToken[gzBEdcPcUwAWLnjpsoWUNY]",
    ];

    const response = await axios.post(
      'https://us-central1-egobus-5be34.cloudfunctions.net/sendNotificationToMany',
      {
        tokens,
        title: 'Test Notification by SSL the Boss',
        body: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Notification response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
  }
};
