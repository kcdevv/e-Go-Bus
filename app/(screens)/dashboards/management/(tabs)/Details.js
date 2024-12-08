import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import tw from "tailwind-react-native-classnames";
import { fetchSchoolBuses } from "../services/fetchdata";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StudentDetails = () => {
  const [buses, setBuses] = useState([]);
  const [expandedBuses, setExpandedBuses] = useState({});
  const [expandedTrips, setExpandedTrips] = useState({});
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadSchoolData = async () => {
      const schoolID = await AsyncStorage.getItem("schoolID");
      if (schoolID) {
        try {
          const busesData = await fetchSchoolBuses(schoolID);
          if (busesData) {
            setBuses(Object.entries(busesData)); // Convert to array of key-value pairs
          }
        } catch (error) {
          console.error("Error loading school data:", error);
        }
      }
    };
    loadSchoolData();
  }, []);

  const handleSearch = () => {
    const results = [];
    buses.forEach(([busID, busData]) => {
      Object.entries(busData.trips || {}).forEach(([tripID, trip]) => {
        Object.entries(trip.students || {}).forEach(([studentID, student]) => {
          if (student.studentName.toLowerCase().includes(searchText.toLowerCase())) {
            results.push({ student, busID, tripID });
          }
        });
      });
    });
    setSearchResults(results);
    if (results.length === 0 && searchText.trim()) {
      Alert.alert("Student not found");
    }
  };

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

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudent(null);
  };

  return (
    <View style={tw`flex-1 p-4`}>
      {/* Search Bar */}
      <TextInput
        style={tw`border border-gray-400 rounded-lg p-3 mb-4`}
        placeholder="Search for a student..."
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          handleSearch();
        }}
      />

      {/* Conditional Rendering for Search Results */}
      {searchResults.length > 0 && searchText.trim() ? (
        <View style={tw`h-60`}>
          <Text style={tw`text-2xl font-bold mb-2`}>Search Results</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={tw`mb-3 p-3 bg-gray-100 rounded-lg`}
                onPress={() => {
                  setSelectedStudent(item);
                  setModalVisible(true);
                }}
              >
                <Text style={tw`text-lg font-semibold`}>{item.student.studentName}</Text>
                <Text>{item.student.standard}</Text>
                <Text>
                  Bus ID: {item.busID} - Trip ID: {item.tripID}
                </Text>
              </TouchableOpacity>
            )}
            style={tw`flex-1`}
            contentContainerStyle={tw`pb-4`}
          />
        </View>
      ) : (
        <Text style={tw`text-lg mb-4`}>
          {searchText.trim() ? "No results found. Try a different query." : ""}
        </Text>
      )}

      {/* Bus List */}
      <FlatList
        data={buses}
        keyExtractor={([busID]) => busID}
        renderItem={({ item: [busID, busData] }) => (
          <View style={tw`p-4 bg-yellow-100 rounded-lg mb-4 shadow-md`}>
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
                          <Text key={studentID} style={tw`text-sm text-black`}>
                            - {student.studentName} ({student.standard})
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal for Student Details */}
      {selectedStudent && (
        <Modal animationType="slide" transparent visible={modalVisible}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
              <View style={tw`bg-white p-5 rounded-lg shadow-lg w-80`}>
                <Text style={tw`text-xl font-bold mb-4`}>Student Details</Text>
                {selectedStudent.student.profilePic && (
                  <Image
                    source={{ uri: selectedStudent.student.profilePic }}
                    style={tw`w-20 h-20 rounded-full mb-4 mx-auto`}
                  />
                )}
                <Text>Student Name: {selectedStudent.student.studentName}</Text>
                <Text>Standard: {selectedStudent.student.standard}</Text>
                <Text>Bus ID: {selectedStudent.busID}</Text>
                <Text>Trip ID: {selectedStudent.tripID}</Text>
                <TouchableOpacity
                  style={tw`mt-5 p-3 bg-blue-500 rounded-lg`}
                  onPress={closeModal}
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
