import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import tw from 'tailwind-react-native-classnames'; 

const CalendarPage = () => {
  // State to store attendance status (Present or Absent for each day)
  const [attendance, setAttendance] = useState({
    '2024-11-10': 'present', // Example: the student is present on 10th November
    '2024-11-12': 'absent',  // Example: the student is absent on 12th November
  });

  // Function to handle day press
  const handleDayPress = (day) => {
    const date = day.dateString;
    setAttendance((prev) => ({
      ...prev,
      [date]: prev[date] === 'present' ? 'absent' : 'present', // Toggle between present and absent
    }));
  };

  // Get marked dates for the calendar
  const markedDates = Object.keys(attendance).reduce((acc, date) => {
    acc[date] = {
      selected: true,
      selectedColor: attendance[date] === 'present' ? 'green' : 'red',
    };
    return acc;
  }, {});

  return (
    <View style={tw`flex-1 p-4 bg-white`}>
      <Text style={tw`text-2xl font-bold text-center mb-4`}>Student Attendance Calendar</Text>
      <Calendar
        current={'2024-11-01'}
        markedDates={markedDates} // Pass the marked dates to the calendar
        onDayPress={handleDayPress} // Set up day press functionality
        style={tw`border border-gray-300 rounded-lg`} // Calendar styling using twrnc
      />
    </View>
  );
};

export default CalendarPage;
