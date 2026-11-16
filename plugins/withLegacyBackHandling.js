const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Targeting Android SDK 36 turns on predictive back by default, which stops
 * Android from calling `Activity.onBackPressed()`. React Native 0.74 (Expo
 * SDK 51) still routes the hardware back button through `onBackPressed`, so
 * without this opt-out the back button/gesture closes the app instead of
 * popping the navigation stack. Remove once on an RN version with
 * OnBackInvokedCallback support.
 */
module.exports = function withLegacyBackHandling(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:enableOnBackInvokedCallback"] = "false";
    }
    return mod;
  });
};
