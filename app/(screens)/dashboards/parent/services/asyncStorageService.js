import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchAsyncStorageData = async (setBusID, setSchoolID, setTripID) => {
  try {
    const storedBusID = await AsyncStorage.getItem('busID');
    const storedSchoolID = await AsyncStorage.getItem('schoolID');
    const storedTripID = await AsyncStorage.getItem('tripID');

    if (storedBusID && storedSchoolID && storedTripID) {
      setBusID(storedBusID.replace(/"/g, '').trim());
      setSchoolID(storedSchoolID.replace(/"/g, '').trim());
      setTripID(storedTripID.replace(/"/g, '').trim());
    } else {
      alert('Missing required data in AsyncStorage.');
    }
  } catch (error) {
    console.error('Error fetching data from AsyncStorage', error);
  }
};

export default fetchAsyncStorageData;
