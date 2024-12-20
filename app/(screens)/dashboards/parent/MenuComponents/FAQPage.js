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
      question: "How can I track my child's bus in real time?",
      answer: "Once you log into your parent account, go to the 'Track Bus' section to see your child's bus location in real time. You can also receive notifications for pickup and drop-off times."
    },
    {
      id: 2,
      question: "What should I do if my child loses something on the bus?",
      answer: "If your child loses an item, go to the 'Missing Items ' section in the app their you can find  details like the item's description,Item Image."
    },
    {
      id: 3,
      question: "Can I notify the bus driver if my child will be absent?",
      answer: "Yes, if your child won't be riding the bus, you can easily mark absent in the app. This ensures the bus doesn't stop unnecessarily."
    },
   
    {
      id: 4,
      question: "What should I do if I encounter any technical issues with the app?",
      answer: "If you experience any issues, You can  reach out to our support team via email at egobusgsc@gmail.com, and we'll resolve the issue as soon as possible."
    },
    
    {
      id: 5,
      question: "What happens if there are changes to the bus route or schedule?",
      answer: "If there are any changes to the route or schedule, you will receive an instant notification via the app. Be sure to check your notifications regularly to stay informed."
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
    <ScrollView style={tw`flex-1 px-4 py-4 bg-white`}>
      
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
