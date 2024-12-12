import { Stack } from "expo-router"
import { initializeApp } from 'firebase/app';
import firebaseConfig  from '../firebase.config'

const app = initializeApp(firebaseConfig); 

const RootLayout = () => {
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: 'yellow',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        <Stack.Screen name="(screens)" options={{headerShown: false}} />
        {/* <Stack.Screen name="index" /> */}
    </Stack>
  )
}

export default RootLayout