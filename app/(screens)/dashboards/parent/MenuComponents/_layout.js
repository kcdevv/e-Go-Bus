import { Stack } from 'expo-router';

export default function ParentMenuLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Set false to disable headers globally
            }}
        >
            <Stack.Screen
                name="Attendance"
                options={{
                    title: 'Attendance', // Temporary title for debugging
                    headerShown: true,
                    headerStyle: { backgroundColor: '#FCD32D' },
                    headerTintColor: '#000',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="MissingItemsNotification"
                options={{
                    title: 'Missing Items', // Temporary title for debugging
                    headerShown: true,
                    headerStyle: { backgroundColor: '#FCD32D' },
                    headerTintColor: '#000',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="FAQPage"
                options={{
                    title: 'FAQs', // Temporary title for debugging
                    headerShown: true,
                    headerStyle: { backgroundColor: '#FCD32D' },
                    headerTintColor: '#000',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
        </Stack>
    );
}
