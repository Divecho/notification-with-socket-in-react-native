package com.liveupdates

import android.app.Service
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Notification
import android.app.PendingIntent   
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import java.util.concurrent.TimeUnit


class MyService : Service() {

    private var ws: WebSocket? = null
    private val handler = Handler(Looper.getMainLooper())

    private val channelId = "live_updates"

    override fun onCreate() {
        super.onCreate()
        log("Service Created")

        startForegroundNotification()
        initWebSocket()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        log("Service Started")
        return START_STICKY
    }

    private fun startForegroundNotification() {
        val manager = getSystemService(NotificationManager::class.java)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Live Update Service",
                NotificationManager.IMPORTANCE_HIGH  // UPDATED
            )
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Background Service Running")
            .setContentText("Listening for messages…")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1, notification)
    }

    private fun initWebSocket() {
        log("Connecting WebSocket…")

        val request = Request.Builder()
            .url("ws://192.168.1.4:4000") // आपका server IP
            .build()

        val client = OkHttpClient.Builder()
            .retryOnConnectionFailure(true)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .build()

        ws = client.newWebSocket(request, object : WebSocketListener() {

            override fun onMessage(webSocket: WebSocket, text: String) {
    log("Message Received: $text")

    // Send to React Native
    sendEvent("NEW_NOTIFICATION", text)

    try {
        // Parse JSON
        val json = org.json.JSONObject(text)
        val notif = json.getJSONObject("notification")

        val title = notif.getString("title")
        val message = notif.getString("message")

        // Show native notification with only title + message
        showNativeNotification(title, message)

    } catch (e: Exception) {
        log("JSON Parse Error: ${e.message}")
        showNativeNotification("New Message", text)
    }
}


            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                log("WebSocket Error: ${t.message}")
                retryWebSocket()
            }
        })
    }

    private fun retryWebSocket() {
        handler.postDelayed({
            initWebSocket()
        }, 3000)
    }

    private fun sendEvent(eventName: String, data: String) {
        try {
            val reactContext = GlobalReactContext.context

            if (reactContext == null) {
                handler.postDelayed({
                    sendEvent(eventName, data)
                }, 1000)
                return
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, data)

        } catch (e: Exception) {
            log("SendEvent Error: ${e.message}")
        }
    }

    private fun showNativeNotification(title: String, message: String) {
    val notificationId = System.currentTimeMillis().toInt()

    // जब user notification क्लिक करे → ऐप खुले
    val intent = packageManager.getLaunchIntentForPackage(packageName)
    intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)

    val pendingIntent = PendingIntent.getActivity(
        this,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val builder = NotificationCompat.Builder(this, channelId)
        .setSmallIcon(R.mipmap.ic_launcher)  // आपका ऐप icon
        .setContentTitle(title)
        .setContentText(message)
        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
        .setAutoCancel(true)
        .setContentIntent(pendingIntent)   // <<< सबसे जरूरी
        .setPriority(NotificationCompat.PRIORITY_HIGH)

    val manager = getSystemService(NotificationManager::class.java)
    manager.notify(notificationId, builder.build())
}


    private fun log(msg: String) {
        Log.d("MyService", msg)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
