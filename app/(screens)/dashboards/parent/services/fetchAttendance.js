import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../../../firebase.config'; // Firebase config
import { ref, get, set, query, orderByKey, limitToLast } from 'firebase/database';

export const fetchAttendance = async () => {
    try {
        // Get IDs from AsyncStorage
        const schoolID = JSON.parse(await AsyncStorage.getItem('schoolID') || '""');
        const busID = JSON.parse(await AsyncStorage.getItem('busID') || '""');
        const tripID = JSON.parse(await AsyncStorage.getItem('tripID') || '""');
        const studentID = JSON.parse(await AsyncStorage.getItem('studentID') || '""');

        console.log('Parsed Values:', { schoolID, busID, tripID, studentID });


        if (!schoolID || !busID || !tripID || !studentID) {
            throw new Error('Missing required IDs from AsyncStorage');
        }

        // Reference to attendance in Firebase
        const attendanceRef = query(
            ref(
                database,
                `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}/attendance`
            ),
            orderByKey(),
            limitToLast(31)
        );


        const snapshot = await get(attendanceRef);

        if (snapshot.exists()) {
            console.log("Fetched Data:", snapshot.val());
            const attendanceData = snapshot.val();
            return Object.entries(attendanceData).map(([date, present]) => ({
                date,
                present,
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching attendance:', error);
        throw error;
    }
};