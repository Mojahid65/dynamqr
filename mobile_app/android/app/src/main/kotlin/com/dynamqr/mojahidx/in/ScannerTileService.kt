package com.dynamqr.mojahidx.`in`

import android.content.Intent
import android.net.Uri
import android.service.quicksettings.TileService

class ScannerTileService : TileService() {
    override fun onClick() {
        super.onClick()
        val intent = Intent(this, ScreenCaptureActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        
        // Android 14+ requires starting activity via startActivityAndCollapse method
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val pendingIntent = android.app.PendingIntent.getActivity(
                this,
                0,
                intent,
                android.app.PendingIntent.FLAG_IMMUTABLE
            )
            startActivityAndCollapse(pendingIntent)
        } else {
            @Suppress("DEPRECATION")
            startActivityAndCollapse(intent)
        }
    }
}
