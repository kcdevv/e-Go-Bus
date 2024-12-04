import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Modal, Animated, Easing, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {sendNotification} from '../services/sendNotification.service'

const SendMessage = () => {
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const slideAnim = new Animated.Value(-200);

  const toggleRecipient = (recipient) => {
    // Placeholder for recipient logic
  };




  const handleSend = async () => {
    if (message) {
      // Send notification
      await sendNotification(message);
      console.log('after send notification')
      setIsSent(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Reset fields after sending
      setMessage('');

      // Hide confirmation after 3 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setIsSent(false));
      }, 1000);
    }
  };

 
  return (
    <ScrollView style={tw`flex-1`}>
      <View style={tw`flex-1 justify-center items-center bg-gray-100 p-6 my-5`}>
        {/* Title */}
        <Text style={tw`text-3xl font-bold text-gray-800 mb-10`}>Send a Message</Text>

        {/* Message Input Box */}
        <View style={tw`w-11/12 bg-white rounded-xl p-6 mb-6 shadow-lg`}>
          <TextInput
            style={tw`h-20 text-lg text-gray-800`}
            placeholder="Enter your message..."
            placeholderTextColor="#555"
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>

        {/* Recipient Options (Not used yet, for future implementation) */}
        <View style={tw`w-11/12 mb-10`}>
          <TouchableOpacity
            onPress={() => toggleRecipient('Driver')}
            style={tw`flex-row items-center mb-4 p-4 rounded-lg shadow-md bg-white`}
          >
            <FontAwesome name="user" size={24} color="#888" />
            <Text style={tw`ml-4 text-lg text-gray-700`}>For Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleRecipient('Parents')}
            style={tw`flex-row items-center p-4 rounded-lg shadow-md bg-white`}
          >
            <FontAwesome name="users" size={24} color="#888" />
            <Text style={tw`ml-4 text-lg text-gray-700`}>For Parents</Text>
          </TouchableOpacity>
        </View>

        {/* Send Button */}
        <TouchableOpacity onPress={handleSend} style={[tw`w-40 h-12 rounded-full shadow-lg justify-center items-center`, { backgroundColor: '#FCD32D' }]}>
          <Text style={tw`text-black text-lg font-semibold`}>Send</Text>
        </TouchableOpacity>

        {/* Confirmation Overlay */}
        {isSent && (
          <Modal transparent animationType="fade" visible={isSent}>
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}>
              <Animated.View style={[tw`w-10/12 bg-white p-6 rounded-lg shadow-lg`, { transform: [{ translateY: slideAnim }] }]}>
                <View style={tw`flex-row items-center`}>
                  <FontAwesome name="check-circle" size={28} color="#4CAF50" />
                  <Text style={tw`ml-2 text-lg font-semibold text-gray-800`}>Message Sent Successfully!</Text>
                </View>
              </Animated.View>
            </View>
          </Modal>
        )}
      </View>
    </ScrollView>
  );
};

export default SendMessage;
