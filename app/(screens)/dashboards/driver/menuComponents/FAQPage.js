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
      question: "How do I track the bus?",
      answer: "Once you log in, go to the 'Track Bus' tab to see the real-time location of the bus."
    },
    {
      id: 2,
      question: "How do I report a lost item?",
      answer: "Go to the 'Missing Items' section and select 'Report Lost Item.' Fill in the details and submit."
    },
    {
      id: 3,
      question: "Can I notify the driver if my child won't be on the bus?",
      answer: "Yes, you can notify the driver by clicking on the 'Notify Driver' button in the app."
    },
    {
      id: 4,
      question: "How do I update my contact information?",
      answer: "Navigate to 'Profile' > 'Edit Profile' to update your contact details."
    },
    {
      id: 5,
      question: "What should I do if I face technical issues?",
      answer: "You can contact our support team via the 'Help' section in the app or email us at support@egobus.com."
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
