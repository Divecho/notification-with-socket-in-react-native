package com.liveupdates

import android.os.Bundle
import android.content.Intent
import android.os.Build
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "LiveUpdates"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start foreground service when app is opened
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val myServiceIntent = Intent(this, MyService::class.java)
            startForegroundService(myServiceIntent)
        } else {
            val myServiceIntent = Intent(this, MyService::class.java)
            startService(myServiceIntent)
        }
    }
}
