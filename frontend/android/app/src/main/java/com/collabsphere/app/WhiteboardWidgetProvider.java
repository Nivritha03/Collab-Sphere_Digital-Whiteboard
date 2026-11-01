package com.collabsphere.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import android.view.View;
import android.widget.RemoteViews;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

/**
 * Native Android Home Screen Widget for CollabSphere.
 * Renders the actual shared whiteboard drawings directly on the phone's home screen.
 */
public class WhiteboardWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_UPDATE_PREVIEW = "com.collabsphere.app.ACTION_UPDATE_PREVIEW";
    public static final String ACTION_STOP_SHARING = "com.collabsphere.app.ACTION_STOP_SHARING";
    public static final String PREFS_NAME = "CollabSphereWidgetPrefs";
    public static final String PREF_ROOM_ID = "pref_widget_room_id";
    public static final String PREF_STATUS = "pref_widget_status";
    public static final String PREF_UPDATED_TIME = "pref_widget_updated_time";
    public static final String PREF_HAS_PREVIEW = "pref_widget_has_preview";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();

        if (ACTION_UPDATE_PREVIEW.equals(action) || AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, WhiteboardWidgetProvider.class);
            int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            for (int widgetId : allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId);
            }
        } else if (ACTION_STOP_SHARING.equals(action)) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().clear().apply();
            File file = new File(context.getFilesDir(), "whiteboard_preview.png");
            if (file.exists()) {
                file.delete();
            }

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, WhiteboardWidgetProvider.class);
            int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            for (int widgetId : allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId);
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_whiteboard);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String roomId = prefs.getString(PREF_ROOM_ID, "No Active Room");
        String status = prefs.getString(PREF_STATUS, "Offline");
        String updated = prefs.getString(PREF_UPDATED_TIME, "Never");
        boolean hasPreview = prefs.getBoolean(PREF_HAS_PREVIEW, false);

        views.setTextViewText(R.id.widget_room_id, "#" + (roomId.length() > 8 ? roomId.substring(0, 8) : roomId));
        views.setTextViewText(R.id.widget_status, "● " + status);
        views.setTextViewText(R.id.widget_updated_time, "Updated: " + updated);

        // Load the actual drawing preview image bitmap
        Bitmap previewBitmap = loadPreviewBitmap(context);
        if (previewBitmap != null) {
            views.setViewVisibility(R.id.widget_preview_image, View.VISIBLE);
            views.setViewVisibility(R.id.widget_placeholder_text, View.GONE);
            views.setImageViewBitmap(R.id.widget_preview_image, previewBitmap);
        } else {
            views.setViewVisibility(R.id.widget_placeholder_text, View.VISIBLE);
        }

        // Tap action: open app with deep link to the exact room
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        if (!"No Active Room".equals(roomId)) {
            intent.setData(Uri.parse("https://collabsphere.app/room/" + roomId));
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_canvas_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Save base64 image data sent from the React whiteboard canvas
     */
    public static void savePreviewImage(Context context, String base64Data, String roomId, String status) {
        try {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);
            File file = new File(context.getFilesDir(), "whiteboard_preview.png");
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(decoded);
                fos.flush();
            }

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                    .putString(PREF_ROOM_ID, roomId)
                    .putString(PREF_STATUS, status)
                    .putString(PREF_UPDATED_TIME, java.text.DateFormat.getTimeInstance(java.text.DateFormat.SHORT).format(new java.util.Date()))
                    .putBoolean(PREF_HAS_PREVIEW, true)
                    .apply();

            // Request immediate widget update
            Intent updateIntent = new Intent(context, WhiteboardWidgetProvider.class);
            updateIntent.setAction(ACTION_UPDATE_PREVIEW);
            context.sendBroadcast(updateIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Bitmap loadPreviewBitmap(Context context) {
        try {
            File file = new File(context.getFilesDir(), "whiteboard_preview.png");
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
