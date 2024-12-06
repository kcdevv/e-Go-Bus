import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator } from "react-native";
import CallDriverButton from "../../../../components/CallDriverButton";
import tw from "tailwind-react-native-classnames";
import { ref, onValue } from "firebase/database";
import { database } from '../../../../../firebase.config';

const MissingItemsNotification = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverMobile, setDriverMobile] = useState("");

  useEffect(() => {
    // Firebase reference to the bus data to get driverMobile
    const busRef = ref(database, "schools/stshashyd1234/buses/B001");

    // Firebase reference to 'missingItemNotification' under trips
    const missingItemRef = ref(database, "schools/stshashyd1234/buses/B001/trips/T001/missingItemNotification");

    // Fetch bus data to get the driver mobile number
    const unsubscribeBus = onValue(busRef, (snapshot) => {
      const busData = snapshot.val();
      if (busData) {
        setDriverMobile(busData.driverMobile); // Store driver mobile number
      }
    });

    // Fetch missing item notification data
    const unsubscribeItems = onValue(missingItemRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.keys(data).map((key) => {
          return {
            id: key, // Use Firebase key as unique id
            ...data[key], // Spread the item data
            driverMobile, // Include the driver mobile number
          };
        });
        setItems(formattedData); // Store all missing item notifications
      } else {
        setItems([]); // No data case
      }
      setLoading(false); // Stop loading spinner
    });

    // Cleanup listeners when component unmounts
    return () => {
      unsubscribeBus();
      unsubscribeItems();
    };
  }, [driverMobile]); // The dependency array includes driverMobile to ensure the data is combined after fetching driverMobile.

  // Function to format the date and remove the time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Formats to 'MM/DD/YYYY' by default, or 'YYYY-MM-DD' depending on locale
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 p-4 bg-white`}>
      {items.length === 0 ? (
        <Text style={tw`text-center text-gray-500 mt-20`}>
          No missing items reported yet.
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={tw`border border-gray-300 rounded-lg p-4 mb-4`}>
            {/* Display Date without time */}
            <Text style={tw`text-lg font-bold mb-2`}>
              {formatDate(item.date) || "Unknown Date"}
            </Text>
            {/* Display Image */}
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={tw`w-full h-40 rounded-lg mb-4`}
              />
            ) : (
              <View
                style={tw`w-full h-40 bg-gray-200 rounded-lg items-center justify-center`}
              >
                <Text style={tw`text-gray-500`}>No image available</Text>
              </View>
            )}
            {/* Display Title and Message */}
            <Text style={tw`text-xl font-semibold mb-2`}>
              {item.title || "No title provided"}
            </Text>
            <Text style={tw`text-base mb-4`}>
              {item.message || "No description provided"}
            </Text>
            {/* Call Driver Button */}
            {item.driverMobile && (
              <CallDriverButton phoneNumber={item.driverMobile} />
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default MissingItemsNotification;
