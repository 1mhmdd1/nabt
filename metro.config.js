const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Phone demo is the default. EXPO_PUBLIC_DEMO_LOCAL=0 keeps the real Firebase SDK.
if (process.env.EXPO_PUBLIC_DEMO_LOCAL !== "0") {
  const aliases = {
    "firebase/app": path.resolve(__dirname, "src/local/shims/app.ts"),
    "firebase/auth": path.resolve(__dirname, "src/local/shims/auth.ts"),
    "firebase/firestore": path.resolve(__dirname, "src/local/shims/firestore.ts"),
  };
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const filePath = aliases[moduleName];
    if (filePath) return { type: "sourceFile", filePath };
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
