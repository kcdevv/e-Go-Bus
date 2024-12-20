import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Updated import
import tw from 'tailwind-react-native-classnames';

const FAQPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const videoUrls = {
    english: 'https://youtu.be/J1znAuK1Mbo?si=y4tOOlgA3rzrIoIj', // Sample English video
    hindi: 'https://youtu.be/O1VmtVV2tgg?si=xL0bvg_I4BsvlCDh', // Sample Hindi video
    telugu: 'https://youtu.be/Q7C89ar1DHA?si=PBgTobiknBScoYIx', // Sample Telugu video
  };

  const faqs = [
    {
      id: 1,
      question: "How can I view the real-time location of all buses?",
      answer: "Once you log in, go to the 'Track Bus' tab to see the real-time location of the bus. Management can view the real-time location of all buses on the dashboard."
    },
    {
      id: 2,
      question: "How do I update the details of a bus (e.g., driver info, route changes)?",
      answer: "You can update bus details through the e-GO Bus management website. Log in to the platform, navigate to the upload data section, modify the data accordingly in an Excel file, and upload it again on the e-GO Bus management website."
    },
    {
      id: 3,
      question: "How do I handle technical issues with the e-GO Bus dashboard?",
      answer: "For technical issues, you can contact technical support directly via egobusgsc@gmail.com."
    },
    {
      id: 4,
      question: "How do I notify parents of delays or schedule changes?",
      answer: "Use the Notifications section of the app to send messages to parents. You can send broadcast messages to all parents or target specific trips, buses, or student groups."
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
    <ScrollView style={tw`flex-1 px-4 pt-5 pb-5 bg-white`}>
      <View style={tw`px-1`}>
        {/* Language Selector */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-semibold mb-2`}>Select Language for Video:</Text>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
            style={tw`border rounded-lg`}
          >
            <Picker.Item label="English" value="english" />
            <Picker.Item label="Hindi" value="hindi" />
            <Picker.Item label="Telugu" value="telugu" />
          </Picker>
        </View>

        {/* YouTube Video Preview */}
        <View style={tw`h-56 rounded-lg overflow-hidden mb-8`}>
          <TouchableOpacity onPress={() => openVideo(videoUrls[selectedLanguage])}>
            {/* Generate thumbnail image URL */}
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
      </View>

      {faqs.map((faq) => (
        <View key={faq.id} style={tw`mb-4 border border-gray-300 rounded-lg`}>
          <TouchableOpacity
            onPress={() => toggleExpand(faq.id)}
            style={[tw`p-4 rounded-t-lg`, { backgroundColor: '#FCD32D' }]}>
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
  );
};

export default FAQPage;
