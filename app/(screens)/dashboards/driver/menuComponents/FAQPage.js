// FAQPage.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 


const FAQPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const router = useRouter();
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

  return (
    <View style={tw`flex-1`}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 pt-9`, { height: 75, backgroundColor: '#FCD32D' }]}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
        <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-black`}>FAQs</Text>
      </View>

    <ScrollView style={tw`flex-1 px-4 py-4 bg-white`}>
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
    </ScrollView>
    </View>
  );
};



export default FAQPage;
