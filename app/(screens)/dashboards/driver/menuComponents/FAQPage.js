import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker'; // Picker import for language selection
import { useRouter } from "expo-router";

const FAQPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const router = useRouter();

  const videoUrls = {
    english: 'https://youtu.be/J1znAuK1Mbo?si=y4tOOlgA3rzrIoIj', // Sample English video
    hindi: 'https://youtu.be/O1VmtVV2tgg?si=xL0bvg_I4BsvlCDh', // Sample Hindi video
    telugu: 'https://youtu.be/Q7C89ar1DHA?si=PBgTobiknBScoYIx', // Sample Telugu video
  };

  const faqs = [
    {
      id: 1,
      question: "How do I start a trip?",
      answer: "To start a trip, select the desired trip from the 'Trip Selection' screen and click the 'Start Trip' button."
    },
    {
      id: 2,
      question: "How do I track my current location?",
      answer: "Your location is automatically tracked while a trip is active. You can see your location on the map in real time."
    },
    {
      id: 3,
      question: "How do I know the next pickup location?",
      answer: "The next pickup location will be displayed on the map, and the route will be highlighted. You will also receive a notification when you are near the pickup point."
    },
    {
      id: 4,
      question: "What should I do when I reach a pickup point?",
      answer: "When you reach a pickup point, a confirmation overlay will appear. Click 'Done' to confirm the pickup and move to the next location."
    },
    {
      id: 5,
      question: "How do I end a trip?",
      answer: "To end a trip, press the 'End Trip' button on the map screen. Confirm your action when prompted. This will stop location tracking and end the trip."
    },
  
  ];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openVideo = (url) => {
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  };

  // Function to extract video ID from URL
  const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches && matches[1];
  };

  return (
    <View style={tw`flex-1`}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 pt-9`, { height: 75, backgroundColor: '#FCD32D' }]}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-black`}>FAQs</Text>
      </View>

      {/* Language Selector */}
      <ScrollView style={tw`flex-1 px-4 py-4 bg-white`}>
        <Text style={tw`text-lg font-semibold mb-2`}>Select Language for Video:</Text>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
          style={tw`border rounded-lg mb-4`}
        >
          <Picker.Item label="English" value="english" />
          <Picker.Item label="Hindi" value="hindi" />
          <Picker.Item label="Telugu" value="telugu" />
        </Picker>

        {/* YouTube Video Thumbnail */}
        <View style={tw`h-56 rounded-lg overflow-hidden mb-8`}>
          <TouchableOpacity onPress={() => openVideo(videoUrls[selectedLanguage])}>
            <Image
              source={{
                uri: `https://img.youtube.com/vi/${extractVideoId(videoUrls[selectedLanguage])}/0.jpg`
              }}
              style={tw`h-full w-full`}
            />
            <View style={tw`absolute inset-0 justify-center items-center bg-black bg-opacity-50`}>
              <Text style={tw`text-white text-lg font-bold`}>Watch Video</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        {faqs.map((faq) => (
          <View key={faq.id} style={tw`mb-4 border border-gray-300 rounded-lg`}>
            <TouchableOpacity
              onPress={() => toggleExpand(faq.id)}
              style={[tw`p-4 rounded-t-lg`, { backgroundColor: '#FCD32D' }]}
            >
              <Text style={tw`text-lg font-semibold`}>{faq.question}</Text>
            </TouchableOpacity>
            {expandedId === faq.id && (
              <View style={[tw`p-4 rounded-b-lg`, { backgroundColor: "#F9F3F3" }]}>
                <Text style={[tw`text-base`, { color: "#4b5563" }]}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}

        <Text></Text>
        <Text></Text>
        <Text></Text>
      </ScrollView>
    </View>
  );
};

export default FAQPage;
