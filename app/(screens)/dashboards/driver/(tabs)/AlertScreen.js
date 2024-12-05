import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';

const SosScreen = () => {
  const [countdown, setCountdown] = useState(5); // 5-second countdown
  const [alertActive, setAlertActive] = useState(false);

  // Start countdown when SOS is triggered
  useEffect(() => {
    if (alertActive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Clear timer on component unmount
    } else if (alertActive && countdown === 0) {
      // Trigger SOS action here
      sendAlertToManagement();
    }
  }, [alertActive, countdown]);

  const sendAlertToManagement = () => {
    Alert.alert(
      'SOS Sent!',
      'The alert has been sent to management.',
      [{ text: 'OK', style: 'default' }]
    );
    resetSos();
  };

  const resetSos = () => {
    setAlertActive(false);
    setCountdown(5);
  };

  return (
    <View style={tw`flex-1 bg-red-600 items-center justify-center`}>
      {/* SOS Icon */}
      <View style={tw`mb-8`}>
        <Image
          source={require("../../../../assets/images/sos-icon-removebg-preview.png")}
          style={tw`w-40 h-40`}
        />
      </View>

      {/* Countdown or Action Message */}
      {alertActive ? (
        <Text style={tw`text-white text-3xl mb-2 font-bold`}>
          Alert in {countdown}...
        </Text>
      ) : (
        <Text style={tw`text-white text-lg text-center font-semibold`}>
          Press SOS to send an emergency alert
        </Text>
      )}

      {/* SOS Button */}
      {!alertActive ? (
        <TouchableOpacity
          onPress={() => setAlertActive(true)}
          style={tw`bg-white py-5 px-10 rounded-full shadow-lg my-5`}
        >
          <Text style={tw`text-red-600 text-2xl font-bold`}>SOS</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={resetSos}
          style={tw`bg-white py-3 px-6 rounded-lg shadow-md`}
        >
          <Text style={tw`text-red-600 text-lg font-semibold`}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SosScreen;
