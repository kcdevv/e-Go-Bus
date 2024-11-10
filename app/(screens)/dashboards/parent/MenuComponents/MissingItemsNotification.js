// MissingItemsNotification.js
import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import CallDriverButton from './CallDriverButton';
import tw from 'twrnc';

const MissingItemsNotification = () => {
    const items = [
        {
          id: 1,
          date: 'Today',
          imageUrl: require('../../../../assets/images/bag.png'), // Use local image
          description: 'Someone’s bag is in the bus',
          phoneNumber: '1234567890' // Replace with the actual driver's phone number
        },
        {
          id: 2,
          date: '08/04/2024',
          imageUrl: require('../../../../assets/images/combox.png'), // Use local image
          description: 'Someone’s combox is in the bus',
          phoneNumber: '1234567890' // Replace with the actual driver's phone number
        }
      ];
      

  return (
    <ScrollView style={tw`flex-1 p-4 bg-white`}>
      {items.map((item) => (
        <View key={item.id} style={tw`border border-gray-300 rounded-lg p-4 mb-4`}>
          <Text style={tw`text-lg font-bold mb-2`}>{item.date}</Text>
          <Image source={{ uri: item.imageUrl }} style={tw`w-full h-40 rounded-lg mb-4`} />
          <Text style={tw`text-base mb-4`}>{item.description}</Text>
          <CallDriverButton phoneNumber={item.phoneNumber} />
        </View>
      ))}
    </ScrollView>
  );
};

export default MissingItemsNotification;
