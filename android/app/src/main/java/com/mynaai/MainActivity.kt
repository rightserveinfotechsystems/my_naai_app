package com.mynaai

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "mynaai"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

       // ✅ FIX FOR VIVO / OPPO SYSTEM NAVIGATION OVERLAP
  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(null)

      WindowCompat.setDecorFitsSystemWindows(
          window,
          true
      )
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