package com.collabsphere.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeWidgetBridge")
public class NativeWidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidgetPreview(PluginCall call) {
        String base64 = call.getString("previewDataUrl");
        String roomId = call.getString("roomId", "Live Room");
        String status = call.getString("status", "Connected");

        if (base64 != null && !base64.isEmpty()) {
            WhiteboardWidgetProvider.savePreviewImage(getContext(), base64, roomId, status);

            // Also start/update the lock screen foreground service to show the live board on lock screen
            try {
                android.content.Intent serviceIntent = new android.content.Intent(getContext(), LiveWhiteboardForegroundService.class);
                serviceIntent.setAction(LiveWhiteboardForegroundService.ACTION_START_SERVICE);
                serviceIntent.putExtra(LiveWhiteboardForegroundService.EXTRA_ROOM_ID, roomId);
                serviceIntent.putExtra(LiveWhiteboardForegroundService.EXTRA_STATUS, status);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    getContext().startForegroundService(serviceIntent);
                } else {
                    getContext().startService(serviceIntent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Must provide previewDataUrl");
        }
    }

    @PluginMethod
    public void stopSharingWidget(PluginCall call) {
        // Stop home screen widget
        android.content.Intent intent = new android.content.Intent(getContext(), WhiteboardWidgetProvider.class);
        intent.setAction(WhiteboardWidgetProvider.ACTION_STOP_SHARING);
        getContext().sendBroadcast(intent);

        // Stop lock screen foreground service
        try {
            android.content.Intent serviceIntent = new android.content.Intent(getContext(), LiveWhiteboardForegroundService.class);
            serviceIntent.setAction(LiveWhiteboardForegroundService.ACTION_STOP_SERVICE);
            getContext().startService(serviceIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
