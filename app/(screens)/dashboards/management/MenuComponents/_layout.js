import { Stack } from 'expo-router';

export default function ManagementMenuLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Set false to disable headers globally
            }}
        >
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
