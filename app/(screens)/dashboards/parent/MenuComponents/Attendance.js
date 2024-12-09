import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { fetchAttendance } from '../services/fetchAttendance';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);


  // Fetch attendance data on component mount
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const data = await fetchAttendance();
        setAttendance(data);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadAttendance();
  }, []);
  

  

  // Render each attendance item
  const renderItem = ({ item }) => {
    if (!item.date) return null; // Ensure no crashes on empty objects
    const isPresent = item.present === 'present';
    return (
      <View style={[styles.itemContainer, { backgroundColor: 'white' }]}>
        <Text
          style={[
            styles.text,
            { color: isPresent ? 'green' : 'red' },
          ]}
        >
          {item.date} - {isPresent ? 'Present' : 'Absent'}
        </Text>
      </View>
    );
  };
  

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 p-4 bg-white `}>
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Attendance;
