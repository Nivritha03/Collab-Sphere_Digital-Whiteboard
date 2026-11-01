package com.collabsphere.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

import java.io.File;
import java.io.FileInputStream;

/**
 * Foreground Service for Android.
 * Keeps the shared whiteboard session active and renders the live drawing directly on the Lock Screen!
 * When the app is closed or minimized, this service maintains the live sync and displays the
 * drawing in the Lock Screen Media / BigPicture notification with direct room controls.
 */
public class LiveWhiteboardForegroundService extends Service {

    public static final String CHANNEL_ID = "collabsphere_live_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START_SERVICE = "ACTION_START_SERVICE";
    public static final String ACTION_STOP_SERVICE = "ACTION_STOP_SERVICE";
    public static final String ACTION_UPDATE_NOTIFICATION = "ACTION_UPDATE_NOTIFICATION";

    public static final String EXTRA_ROOM_ID = "EXTRA_ROOM_ID";
    public static final String EXTRA_STATUS = "EXTRA_STATUS";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP_SERVICE.equals(action)) {
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }

            String roomId = intent.getStringExtra(EXTRA_ROOM_ID);
            String status = intent.getStringExtra(EXTRA_STATUS);
            if (roomId == null) roomId = "Live Room";
            if (status == null) status = "Connected";

            Notification notification = buildLockScreenNotification(roomId, status);
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_STICKY; // Keep alive until explicitly stopped
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "CollabSphere Live Whiteboard",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains live whiteboard sync and displays drawing on Lock Screen & Home Screen");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC); // High visibility on lock screen
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildLockScreenNotification(String roomId, String status) {
        // Tap to open whiteboard directly
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setAction(Intent.ACTION_VIEW);
        openIntent.setData(Uri.parse("https://collabsphere.app/room/" + roomId));
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                this,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Stop Sharing action button right from lock screen / notification drawer
        Intent stopIntent = new Intent(this, LiveWhiteboardForegroundService.class);
        stopIntent.setAction(ACTION_STOP_SERVICE);
        PendingIntent pendingStopIntent = PendingIntent.getService(
                this,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("CollabSphere: #" + (roomId.length() > 8 ? roomId.substring(0, 8) : roomId))
                .setContentText("Status: " + status + " • Tap to draw live")
                .setContentIntent(pendingOpenIntent)
                .setOngoing(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // Visible on Lock Screen!
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .addAction(android.R.drawable.ic_menu_view, "Open Board", pendingOpenIntent)
                .addAction(android.R.drawable.ic_delete, "Stop Sharing", pendingStopIntent);

        // Attach actual drawing snapshot preview to the lock screen notification
        Bitmap previewBitmap = loadPreviewBitmap();
        if (previewBitmap != null) {
            builder.setStyle(new NotificationCompat.BigPictureStyle()
                    .bigPicture(previewBitmap)
                    .setBigContentTitle("CollabSphere Live Board #" + (roomId.length() > 6 ? roomId.substring(0, 6) : roomId))
                    .setSummaryText("Real-time drawing • " + status));
            builder.setLargeIcon(previewBitmap);
        }

        return builder.build();
    }

    private Bitmap loadPreviewBitmap() {
        try {
            File file = new File(getFilesDir(), "whiteboard_preview.png");
            if (file.exists()) {
                try (FileInputStream fis = new FileInputStream(file)) {
                    return BitmapFactory.decodeStream(fis);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
