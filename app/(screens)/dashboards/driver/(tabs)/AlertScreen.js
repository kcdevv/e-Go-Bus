import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from 'tailwind-react-native-classnames';

const AlertScreen = () => {
  return (
    <View style={tw`flex-1 w-full h-full bg-white items-center justify-evenly py-5 px-4`}>
      
      {/* Alert Text */}
      <Text style={tw`text-xl font-bold text-center text-black`}>
        Sending alert to Management
      </Text>

      {/* SOS Icon */}
      <View style={tw`my-5`}>
        <Image
          source={require("../../../../assets/images/sos-icon-removebg-preview.png")}
          style={tw`w-32 h-32`}
        />
      </View>

      {/* Buttons */}
      <View style={tw`flex-row justify-around w-full px-4`}>
        <TouchableOpacity
          style={tw`bg-yellow-200 py-3 px-5 rounded-lg shadow-md`}
          accessibilityLabel="Cancel Alert"
        >
          <Text style={tw`text-black font-semibold capitalize`}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`bg-yellow-400 py-3 px-5 rounded-lg shadow-md`}
          accessibilityLabel="Confirm Alert"
        >
          <Text style={tw`text-black font-semibold capitalize`}>Ok</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AlertScreen;
