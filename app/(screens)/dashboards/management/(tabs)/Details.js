import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { fetchSchoolBuses } from "../services/fetchdata";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "tailwind-react-native-classnames";

const StudentDetails = () => {
  const [buses, setBuses] = useState([]);
  const [expandedBuses, setExpandedBuses] = useState({});
  const [expandedTrips, setExpandedTrips] = useState({});
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchResults, setSearchResults] = useState([]); // To store search results

  useEffect(() => {
    const loadSchoolData = async () => {
      const schoolID = await AsyncStorage.getItem("schoolID");
      if (schoolID) {
        try {
          const busesData = await fetchSchoolBuses(schoolID);
          if (busesData) {
            setBuses(Object.entries(busesData)); // Convert to an array of key-value pairs
          }
        } catch (error) {
          console.error("Error loading school data:", error);
        }
      }
    };

    loadSchoolData();
  }, []);

  const toggleBus = (busID) => {
    setExpandedBuses((prev) => ({
      ...prev,
      [busID]: !prev[busID],
    }));
  };

  const toggleTrip = (busID, tripID) => {
    const key = `${busID}-${tripID}`;
    setExpandedTrips((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSearch = () => {
    const results = [];
    buses.forEach(([busID, busData]) => {
      Object.entries(busData.trips || {}).forEach(([tripID, trip]) => {
        Object.entries(trip.students || {}).forEach(([studentID, student]) => {
          const regex = new RegExp(searchText, "i");
          if (regex.test(student.studentName)) {
            results.push({ student, busID, tripID });
          }
        });
      });
    });
    setSearchResults(results); // Store search results
    if (results.length === 0) {
      Alert.alert("Student not found");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudent(null);
  };

  return (
    <View style={tw`flex-1 p-4`}>
      {/* Global ScrollView */}

      <ScrollView style={tw`flex-1`}>
        {/* Search Bar */}
        <TextInput
          style={tw`border border-gray-400 rounded-lg p-3 mb-4`}
          placeholder="Search for a student..."
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            handleSearch(); // Trigger search on text change
          }}
        />

        {/* Search Results - Dynamic Display */}
        {searchResults.length > 0 && (
          <View style={tw`mb-4`}>
            <Text style={tw`text-2xl font-bold mb-4`}>Search Results</Text>
            <ScrollView
              style={tw`h-40`} // Fixed height for search results
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={tw`mb-3 p-3 bg-gray-100 rounded-lg`}
                  onPress={() => {
                    setSelectedStudent(result);
                    setModalVisible(true);
                  }}
                >
                  <Text style={tw`text-lg font-semibold`}>{result.student.studentName}</Text>
                  <Text>{result.student.standard}</Text>
                  <Text>Bus ID: {result.busID} - Trip ID: {result.tripID}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nested Dropdown List */}
        <Text style={tw`text-2xl font-bold mb-4`}>Bus Details</Text>
        {buses.map(([busID, busData]) => (
          <View key={busID} style={tw`p-4 bg-yellow-100 rounded-lg mb-4 shadow-md`}>
            {/* Bus Level */}
            <TouchableOpacity onPress={() => toggleBus(busID)}>
              <Text style={tw`text-lg font-bold text-black mb-2`}>
                {expandedBuses[busID] ? "▼" : "▶"} Bus ID: {busID}
              </Text>
            </TouchableOpacity>

            {expandedBuses[busID] && (
              <View style={tw`pl-4`}>
                {Object.entries(busData.trips || {}).map(([tripID, tripData]) => (
                  <View key={tripID} style={tw`p-3 bg-blue-100 rounded-lg mb-3`}>
                    {/* Trip Level */}
                    <TouchableOpacity onPress={() => toggleTrip(busID, tripID)}>
                      <Text style={tw`text-base font-bold text-blue-700`}>
                        {expandedTrips[`${busID}-${tripID}`] ? "▼" : "▶"} Trip ID: {tripID}
                      </Text>
                    </TouchableOpacity>

                    {expandedTrips[`${busID}-${tripID}`] && (
                      <View style={tw`pl-4`}>
                        {Object.entries(tripData.students || {}).map(([studentID, student]) => (
                          <View key={studentID} style={tw`mb-2`}>
                            {/* Student Level */}
                            <Text style={tw`text-sm text-black`}>
                              - {student.studentName} ({student.standard})
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal for displaying student details */}
      {selectedStudent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
              <View style={tw`bg-white p-5 rounded-lg shadow-lg w-80`}>
                <Text style={tw`text-xl font-bold mb-4`}>Student Details</Text>

                {/* Conditionally render profile picture */}
                {selectedStudent.student.profilePic && (
                  <Image
                    source={{ uri: selectedStudent.student.profilePic }}
                    style={tw`w-20 h-20 rounded-full mb-4 mx-auto`}
                  />
                )}

                {/* Student Information */}
                <Text style={tw`text-lg font-semibold`}>Student Name: {selectedStudent?.student?.studentName}</Text>
                <Text>Standard: {selectedStudent?.student?.standard}</Text>
                <Text>Roll No: {selectedStudent?.student?.rollNo}</Text>
                <Text>Bus ID: {selectedStudent?.busID}</Text>
                <Text>Trip ID: {selectedStudent?.tripID}</Text>

                {selectedStudent?.student?.parentName && (
                  <Text>Parent Name: {selectedStudent?.student?.parentName}</Text>
                )}
                {selectedStudent?.student?.parentMobile && (
                  <Text>Parent Contact: {selectedStudent?.student?.parentMobile}</Text>
                )}

                <TouchableOpacity
                  onPress={closeModal}
                  style={tw`mt-5 p-3 bg-blue-500 rounded-lg`}
                >
                  <Text style={tw`text-white text-center`}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}


    </View>
  );
};

export default StudentDetails;
