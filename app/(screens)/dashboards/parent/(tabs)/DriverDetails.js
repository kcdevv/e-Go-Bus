import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import LottieView from "lottie-react-native";

const DriverDetails = () => {
  return (
    <View style={tw`flex-1 items-center p-4 bg-white`}>
      <LottieView
        style={{ width: 340, height: 200 }}
        source={require("../../../../assets/animations/splashScreenAnimation.json")}
        autoPlay
        loop
        speed={1} 
      />
      <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mb-4 mt-8`}>
        <Text style={tw`text-lg mb-2`}>Driver Name :</Text>
        <Text style={tw`text-lg mb-2`}>Driver ID :</Text>
        <Text style={tw`text-lg mb-2`}>Phone No :</Text>
        <Text style={tw`text-lg mb-2`}>Bus ID :</Text>
        <Text style={tw`text-lg`}>Bus No :</Text>
      </View>
      <TouchableOpacity style={tw`bg-blue-500 w-40 p-3 rounded-lg flex-row items-center justify-center mt-4`}>
        <Text style={tw`text-white text-lg`}>📞 Call Driver</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DriverDetails;
