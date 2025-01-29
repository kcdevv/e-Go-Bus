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
      backgroundColor: "#FFFFFF",
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
        backgroundColor: "#FFFFFFFF",
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
      ...process.env,
      router: {
        origin: false,
      },
      eas: {
        projectId: "4c56cba0-97ab-42c4-9f44-96e2b8ae12be", // EAS Project ID
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
