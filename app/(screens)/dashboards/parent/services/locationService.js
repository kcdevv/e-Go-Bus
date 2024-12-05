import * as Location from 'expo-location';

const requestLocationPermission = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access location was denied');
  }
};

export default requestLocationPermission;
