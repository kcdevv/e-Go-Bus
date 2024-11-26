import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'tailwind-react-native-classnames';

// Sample student data
const students = [
  { id: 1, name: 'Charrvi Reddy' },
  { id: 2, name: 'Hansvi Reddy' },
  { id: 3, name: 'Charrvi Reddy' },
];

const Attendance = () => {
  return (
    <View style={tw`flex-1 bg-white py-6 px-4`}>
      {/* Header */}
      <Text style={tw`text-2xl font-bold text-center text-black mb-6`}>Attendance</Text>

      {/* Student List */}
      <ScrollView>
        {students.map((student) => (
          <View
            key={student.id}
            style={tw`bg-yellow-50 p-4 mb-4 rounded-lg shadow-sm`}
          >
            {/* Avatar and Name */}
            <View style={tw`flex-row items-center mb-4`}>
              <Image
                source={require('../../../../assets/images/student.png')} // Ensure this path is correct
                style={[tw`rounded-full border-2 border-gray-300`, { width: 48, height: 48 }]}
              />
              <View style={tw`justify-center ml-4`}>
                <Text style={tw`text-lg font-semibold text-black`}>{student.name}</Text>
              </View>
            </View>

            {/* Attendance Options */}
            <View style={tw`flex-row justify-around items-center`}>
              {/* Absent */}
              <TouchableOpacity style={tw`flex-row items-center`}>
                <Text style={tw`text-red-500 text-2xl font-bold mr-2`}>✗</Text>
                <Text style={tw`text-red-500 text-sm`}>Absent</Text>
              </TouchableOpacity>

              {/* Present */}
              <TouchableOpacity style={tw`flex-row items-center`}>
                <Text style={tw`text-green-500 text-2xl font-bold mr-2`}>✓</Text>
                <Text style={tw`text-green-500 text-sm`}>Present</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Attendance;
