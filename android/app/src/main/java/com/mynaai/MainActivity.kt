package com.mynaai

import android.content.Context
import android.content.Intent // 👈 Required for onNewIntent
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "mynaai"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // 🎯 CRITICAL FIX FOR NOTIFICATION TAPS IN RECENT APPS / BACKGROUND
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  // ✅ EDGE-TO-EDGE (Google Play "deprecated APIs for edge-to-edge" fix)
  //
  // Previously this override called WindowCompat.setDecorFitsSystemWindows(window, true)
  // to fight the system-navigation overlap on Vivo/Oppo devices. That approach:
  //   * is ignored on Android 15/16 (edge-to-edge is enforced for targetSdk 35+),
  //   * conflicts with React Native's own edge-to-edge support, and
  //   * is reported by Play Console as deprecated edge-to-edge behavior.
  //
  // Edge-to-edge is now enabled the supported way: edgeToEdgeEnabled=true in
  // gradle.properties lets React Native make the bars transparent, and content
  // avoids the system bars via insets (react-native-safe-area-context +
  // react-navigation), which also fixes the old Vivo/Oppo overlap correctly.
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  // 🔥 BLOCK FONT SCALING
  override fun getResources(): Resources {
    val res = super.getResources()
    val config = Configuration(res.configuration)
    config.fontScale = 1.0f
    res.updateConfiguration(config, res.displayMetrics)
    return res
  }

  // 🔥 EXTRA SAFETY (recommended)
  override fun attachBaseContext(newBase: Context) {
    val config = Configuration(newBase.resources.configuration)
    config.fontScale = 1.0f
    val context = newBase.createConfigurationContext(config)
    super.attachBaseContext(context)
  }
}
