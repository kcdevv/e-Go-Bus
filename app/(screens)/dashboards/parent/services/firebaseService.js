import { ref, onValue } from 'firebase/database';
import { database } from '../../../../../firebase.config'; // Adjust path if needed

const fetchBusLocation = (busID, schoolID, tripID, setBusLocation, setBusHeading, setLoading) => {
  const locationRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);
  
  const fetchLocation = () => {
    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.latitude && data.longitude) {
          setBusLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setBusHeading(data.heading);
          setLoading(false);
        } else {
          console.warn("Missing latitude or longitude in Firebase data");
        }
      } else {
        console.warn("No data available at this Firebase path");
      }
    });

    return unsubscribe;
  };

  const intervalId = setInterval(fetchLocation, 2000);
  return () => clearInterval(intervalId);
};

export default fetchBusLocation;
