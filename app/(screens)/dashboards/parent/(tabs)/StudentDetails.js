import React from 'react';
import { Text, View, Image } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import LottieView from "lottie-react-native";

const StudentDetails = () => {
  return (
    <View style={tw`flex-1 items-center p-4 bg-white`}>

      {/* <LottieView
        style={{ width: 270, height: 150 }}
        source={require("../../../../assets/animations/bus.json")}
        autoPlay
        loop
        speed={1}
      /> */}
      <Image source={require('../../../../assets/images/student.png')} style={tw`w-20 h-20 rounded-full mb-2`} />
      <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mb-2 mt-2`}>
        <Text style={tw`text-center text-lg font-bold mb-2`}>VI Standard</Text>
        <Text style={tw`text-lg mb-2`}>Name : child name</Text>
        <Text style={tw`text-lg mb-2`}>Roll No :</Text>
        <Text style={tw`text-lg mb-2`}>Parent Name :</Text>
        <Text style={tw`text-lg mb-2`}>Phone No :</Text>
        <Text style={tw`text-lg`}>School Name :</Text>
      </View>
      <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mt-4`}>
        <Text style={tw`text-lg font-bold text-center mb-2`}>Today Date</Text>
        <View style={tw`flex-row justify-around`}>
          <Text style={tw`text-red-500 text-lg`}>❌ Absent</Text>
          <Text style={tw`text-green-500 text-lg`}>✅ Present</Text>
        </View>
      </View>
      <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mt-4`}>
        <Text style={tw`text-lg font-bold text-center mb-2`}>Tomorrow Date</Text>
        <View style={tw`flex-row justify-around`}>
          <Text style={tw`text-red-500 text-lg`}>❌ Absent</Text>
          <Text style={tw`text-green-500 text-lg`}>✅ Present</Text>
        </View>
      </View>


    </View>
  );
};

export default StudentDetails;
