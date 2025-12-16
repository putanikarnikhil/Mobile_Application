import "dotenv/config";

export default {
  expo: {
    name: "VIMS",
    slug: "testing-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/thumbnail_image005.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      url: "https://u.expo.dev/your-project-id",
      checkAutomatically: "ON_LOAD",
    },
    runtimeVersion: "exposdk:54.0.0",
    ios: {
      supportsTablet: true,
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: "./src/assets/adaptive-icon.png",
      //   backgroundColor: "#ffffff",
      // },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.testingapp",
    },
    web: {
      favicon: "./assets/favicon.png",
    },

    // ✅ UPDATED extra block with EAS projectId
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      eas: {
        projectId: "fb77044f-f5c4-40d8-b03e-1455f4ec4ea0",
      },
    },
  },
};
