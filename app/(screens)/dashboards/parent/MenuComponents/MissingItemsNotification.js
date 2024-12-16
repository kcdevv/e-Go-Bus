import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator } from "react-native";
import CallDriverButton from "../../../../components/CallDriverButton";
import tw from "tailwind-react-native-classnames";
import { ref, onValue } from "firebase/database";
import { database } from '../../../../../firebase.config';
import AsyncStorage from "@react-native-async-storage/async-storage";

const MissingItemsNotification = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverMobile, setDriverMobile] = useState("");
  const [schoolID, setSchoolID] = useState(null);
  const [busID, setBusID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [driverID, setDriverID] = useState(null);

  useEffect(() => {
    const loadAsyncStorageValues = async () => {
      try {
        const storedSchoolID = await AsyncStorage.getItem('schoolID');
        const storedBusID = await AsyncStorage.getItem('busID');
        const storedTripID = await AsyncStorage.getItem('tripID');
        const storedDriverID = await AsyncStorage.getItem('driverID');

        // Handle cases where AsyncStorage returns null
        setSchoolID(storedSchoolID ? storedSchoolID.replace(/['"]+/g, '') : null);
        setBusID(storedBusID ? storedBusID.replace(/['"]+/g, '') : null);
        setTripID(storedTripID ? storedTripID.replace(/['"]+/g, '') : null);
        setDriverID(storedDriverID ? storedDriverID.replace(/['"]+/g, '') : null);
      } catch (error) {
        console.error("❌ Error loading AsyncStorage values:", error);
      }
    };

    loadAsyncStorageValues();
  }, []);

  useEffect(() => {
    if (!schoolID || !busID || !tripID) return;

    const busRef = ref(database, `schools/${schoolID}/buses/${busID}`);
    const missingItemRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/missingItemNotification`);

    const unsubscribeBus = onValue(busRef, (snapshot) => { 
      const busData = snapshot.val();
      setDriverMobile(busData?.driverMobile || '');
    });

    const unsubscribeItems = onValue(missingItemRef, (snapshot) => {
      const data = snapshot.val();
      const formattedData = data ? Object.keys(data).map((key) => ({
        id: key, 
        ...data[key],
      })) : [];

      setItems(formattedData);
      setLoading(false);
    });

    return () => {
      unsubscribeBus();
      unsubscribeItems();
    };
  }, [schoolID, busID, tripID]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text style={tw`text-center text-gray-500 mt-20`}>
          No missing items reported yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 p-4 bg-white`}>
      {items.map((item) => (
        <View key={item.id} style={tw`border border-gray-300 rounded-lg p-4 mb-4`}>
          {item.date && (
            <Text style={tw`text-lg font-bold mb-2`}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          )}
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={tw`w-full h-40 rounded-lg mb-4`}
            />
          )}
          {item.title && (
            <Text style={tw`text-xl font-semibold mb-2`}>
              {item.title}
            </Text>
          )}
          {item.message && (
            <Text style={tw`text-base mb-4`}>
              {item.message}
            </Text>
          )}
          {driverMobile && driverMobile !== "" && (
            <View style={tw`mb-4`}>
              <CallDriverButton phoneNumber={driverMobile} />
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default MissingItemsNotification;