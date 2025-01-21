import dotenv from "dotenv";
dotenv.config(); 

export default {
  expo: {
    name: "e-Go Bus",
    slug: "e-Go-Bus",
    scheme: "e-Go-Bus",
    owner: "e-go-bus",
    newArchEnabled: true,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./app/assets/images/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./app/assets/images/logo.png",
      resizeMode: "cover",
      backgroundColor: "white",
    },
    notification: {
      "icon": "./app/assets/images/logo.png",
      "androidMode": "default",
      "androidCollapsedTitle": "e-Go Bus"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We need your location for maps",
        NSLocationAlwaysUsageDescription:
          "We need your location for maps and directions",
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
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      useNextNotificationsApi: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],
    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
      router: {
        origin: false,
      },
      eas: {
        projectId: "edf3ac22-146d-476a-a235-f1ed9ff741fe", // EAS Project ID
      },
    },
    doctor: {
      reactNativeDirectoryCheck: {
        exclude: ["react-native-maps"],
        listUnknownPackages: false
      }
    }
  },
};