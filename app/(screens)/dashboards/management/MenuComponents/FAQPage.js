// FAQPage.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker'; // Updated import
import tw from 'tailwind-react-native-classnames';

const FAQPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const videoUrls = {
    english: 'https://www.youtube.com/embed/EqDlrimnMCE?si=em1k8oxtJep5tkSz', // Sample English video
    hindi: 'https://www.youtube.com/embed/4gJQThk2OUQ', // Sample Hindi video
    telugu: 'https://www.youtube.com/embed/ALzBlyjFzdc', // Sample Telugu video
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

  return (
    <ScrollView style={tw`flex-1 px-4 py-8 bg-white`}>
      <Text style={tw`text-2xl font-bold mb-4 text-center`}>Frequently Asked Questions</Text>
     

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
              <Text style={[tw`text-base`, { color: "#4b5563"}]}>{faq.answer}</Text>
            </View>
          )}
        </View>
      ))}
       <View style={tw`mb-6`}>
        {/* Language Selector */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-semibold mb-2`}>Select Language for Video:</Text>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
            style={tw`border border-gray-300 rounded-lg`}
          >
            <Picker.Item label="English" value="english" />
            <Picker.Item label="Hindi" value="hindi" />
            <Picker.Item label="Telugu" value="telugu" />
          </Picker>
        </View>

        {/* YouTube Video Embed */}
        <View style={tw`h-56 rounded-lg overflow-hidden mb-20`}>
          <WebView
            source={{ uri: videoUrls[selectedLanguage] }}
            style={tw`h-full w-full`}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true} // Enable JavaScript
            domStorageEnabled={true} // Enable DOM Storage
            mediaPlaybackRequiresUserAction={false} // Allow media playback without user action
          />
        </View>
      </View>
      
    </ScrollView>
    
  );
};

export default FAQPage;
