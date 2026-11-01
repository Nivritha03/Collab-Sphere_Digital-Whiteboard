// iOS WidgetKit / ActivityKit Swift Implementation
// Target: CollabSphereWidgetExtension (iOS 16.0+)
// File: CollabSphereWidget.swift

import WidgetKit
import SwiftUI

struct WhiteboardEntry: TimelineEntry {
    let date: Date
    let roomId: String
    let status: String
    let participantCount: Int
    let previewImage: UIImage?
}

struct WhiteboardTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> WhiteboardEntry {
        WhiteboardEntry(
            date: Date(),
            roomId: "LIVE-ROOM",
            status: "Connected",
            participantCount: 2,
            previewImage: nil
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WhiteboardEntry) -> Void) {
        let entry = loadCachedEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WhiteboardEntry>) -> Void) {
        let entry = loadCachedEntry()
        // Refresh every 15 minutes or when app requests widget refresh via WidgetCenter
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadCachedEntry() -> WhiteboardEntry {
        let defaults = UserDefaults(suiteName: "group.com.collabsphere.app")
        let roomId = defaults?.string(forKey: "roomId") ?? "Live Room"
        let status = defaults?.string(forKey: "status") ?? "Connected"
        let count = defaults?.integer(forKey: "participantCount") ?? 1

        var image: UIImage? = nil
        if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.collabsphere.app") {
            let fileURL = containerURL.appendingPathComponent("whiteboard_preview.png")
            if let data = try? Data(contentsOf: fileURL) {
                image = UIImage(data: data)
            }
        }

        return WhiteboardEntry(
            date: Date(),
            roomId: roomId,
            status: status,
            participantCount: count,
            previewImage: image
        )
    }
}

struct CollabSphereWidgetEntryView : View {
    var entry: WhiteboardTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(spacing: 6) {
            // Header
            HStack {
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                    Text("CollabSphere")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.primary)
                    Text("#\(entry.roomId.prefix(6))")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)
                }
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 9))
                        .foregroundColor(.indigo)
                    Text("\(entry.participantCount)")
                        .font(.system(size: 10, weight: .bold))
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }

            // Whiteboard Drawing Surface
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white)
                    .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)

                if let img = entry.previewImage {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFit()
                        .padding(4)
                } else {
                    VStack(spacing: 4) {
                        Image(systemName: "pencil.and.outline")
                            .font(.system(size: 24))
                            .foregroundColor(.gray.opacity(0.5))
                        Text("Tap to open shared canvas")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Footer
            HStack {
                Text("Updated: \(entry.date, style: .time)")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                Spacer()
                Text("Open Board ↗")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.blue)
            }
        }
        .padding(12)
        .widgetURL(URL(string: "https://collabsphere.app/room/\(entry.roomId)"))
    }
}

@main
struct CollabSphereWidget: Widget {
    let kind: String = "CollabSphereWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WhiteboardTimelineProvider()) { entry in
            CollabSphereWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Collab-Sphere Whiteboard")
        .description("Displays real-time shared whiteboard drawing directly on your iPhone home screen.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
