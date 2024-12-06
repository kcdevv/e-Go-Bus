import 'dotenv/config'; // Load .env file

export default {
  expo: {
    name: "e-Go Bus",
    slug: "e-Go-Bus",
    scheme: "e-Go-Bus",
    newArchEnabled: true,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./app/assets/images/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./app/assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We need your location for maps",
        NSLocationAlwaysUsageDescription: "We need your location for maps and directions",
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
      entitlements: {
        "aps-environment": "production",
      },
      bundleIdentifier: "com.kcjod.eGoBus",
    },
    android: {
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_WIFI_STATE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
      ],
      adaptiveIcon: {
        foregroundImage: "./app/assets/images/icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.kcjod.eGoBus",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY, // Google Maps API Key
        },
      },
      useNextNotificationsApi: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],
    extra: {
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      },
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID, // EAS Project ID
      },
    },
  },
};
