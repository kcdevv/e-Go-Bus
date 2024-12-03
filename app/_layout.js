import { Stack } from "expo-router"
import '../firebase.config'
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