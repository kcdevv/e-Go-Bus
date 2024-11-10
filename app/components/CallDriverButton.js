// CallDriverButton.js
import React from 'react';
import { TouchableOpacity, Text, Linking } from 'react-native';
import tw from 'tailwind-react-native-classnames';

const CallDriverButton = ({ phoneNumber }) => {
  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <TouchableOpacity
      style={tw`bg-blue-500 py-2 rounded-lg items-center`}
      onPress={handleCall}
    >
      <Text style={tw`text-white text-lg`}>📞 Call Driver</Text>
    </TouchableOpacity>
  );
};

export default CallDriverButton;
