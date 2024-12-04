import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Linking } from "react-native";
import tw from "tailwind-react-native-classnames";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DriverDetails = () => {
  const [driverData, setDriverData] = useState(null);
  const [tripID, setTripID] = useState('N/A');
  const [busID, setBusID] = useState('N/A');
  const [schoolID, setSchoolID] = useState('N/A');
  const [studentID, setStudentID] = useState('N/A');

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {

        const driverDetails = await AsyncStorage.getItem("driverDetails");
        if (driverDetails) {
          setDriverData(JSON.parse(driverDetails));
        }
        const trip = await AsyncStorage.getItem("tripID");
        const bus = await AsyncStorage.getItem("busID");
        const school = await AsyncStorage.getItem("schoolID");
        const student = await AsyncStorage.getItem("studentID");
        if (trip && bus && school && student) {
          setTripID(JSON.parse(trip));
          setBusID(JSON.parse(bus));
          setSchoolID(JSON.parse(school));
          setStudentID(JSON.parse(student));
        }

      } catch (error) {
        console.error("Error fetching driver details:", error);
      }
    };

    fetchDriverDetails();
  }, []);

  const handleCallDriver = () => {
    if (driverData && driverData.driverMobile) {
      const phoneNumber = `tel:${driverData.driverMobile}`;
      Linking.openURL(phoneNumber);
    } else {
      alert("Driver's phone number is not available");
    }
  };

  if (!driverData) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
        <Text style={tw`text-lg`}>Driver Name: {driverData.driverName}</Text>
        <Text style={tw`text-lg`}>Phone No: {driverData.driverMobile}</Text>
        <Text style={tw`text-lg`}>Bus No: {driverData.busNo || "N/A"}</Text>
        <Text style={tw`text-lg`}>Bus ID: {busID || "N/A"}</Text>
        <Text style={tw`text-lg`}>Trip ID: {tripID || "N/A"}</Text>
      </View>
      <TouchableOpacity
        style={tw`bg-blue-500 w-40 p-3 rounded-lg flex-row items-center justify-center mt-4`}
        onPress={handleCallDriver}
      >
        <Text style={tw`text-white text-lg`}>📞  Call Driver</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DriverDetails;
