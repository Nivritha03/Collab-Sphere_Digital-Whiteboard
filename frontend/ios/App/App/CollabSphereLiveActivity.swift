// iOS Live Activities / ActivityKit Implementation (iOS 16.1+)
// Target: CollabSphereActivityExtension
// Provides persistent Lock Screen live preview and Dynamic Island updates

import ActivityKit
import WidgetKit
import SwiftUI

public struct CollabSphereAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var status: String
        public var participantCount: Int
        public var lastUpdated: Date
    }

    public var roomId: String
    public var roomName: String
}

@available(iOS 16.1, *)
struct CollabSphereLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CollabSphereAttributes.self) { context in
            // Lock Screen Live Activity Banner
            LockScreenLiveActivityView(context: context)
                .widgetURL(URL(string: "https://collabsphere.app/room/\(context.attributes.roomId)"))
        } dynamicIsland: { context in
            // iPhone 14/15/16 Dynamic Island expanded & compact presentations
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Circle().fill(Color.green).frame(width: 8, height: 8)
                        Text("Live Board")
                            .font(.system(size: 11, weight: .bold))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 4) {
                        Image(systemName: "person.2.fill")
                        Text("\(context.state.participantCount)")
                    }
                    .font(.system(size: 11, weight: .bold))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.roomName)
                            .font(.system(size: 12, weight: .semibold))
                        Text("Status: \(context.state.status) • Tap to view live drawing")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            } compactLeading: {
                Circle().fill(Color.green).frame(width: 8, height: 8)
            } compactTrailing: {
                Text("#\(context.attributes.roomId.prefix(4))")
                    .font(.system(size: 10, weight: .bold))
            } minimal: {
                Circle().fill(Color.green).frame(width: 8, height: 8)
            }
        }
    }
}

// Lock Screen Expanded View
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<CollabSphereAttributes>

    var body: some View {
        HStack(spacing: 12) {
            // Live Thumbnail from Shared App Group Storage
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white)
                    .frame(width: 72, height: 72)
                    .shadow(radius: 2)

                if let image = loadSharedPreview() {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .padding(2)
                } else {
                    Image(systemName: "pencil.tip.crop.circle")
                        .font(.system(size: 28))
                        .foregroundColor(.blue)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("CollabSphere")
                        .font(.system(size: 12, weight: .black))
                    Text("#\(context.attributes.roomId.prefix(6))")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("● \(context.state.status)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.green)
                }

                Text(context.attributes.roomName)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.primary)

                HStack {
                    Text("Participants: \(context.state.participantCount)")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("Open Board ↗")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.blue)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
    }

    private func loadSharedPreview() -> UIImage? {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.collabsphere.app") else {
            return nil
        }
        let fileURL = containerURL.appendingPathComponent("whiteboard_preview.png")
        if let data = try? Data(contentsOf: fileURL) {
            return UIImage(data: data)
        }
        return nil
    }
}
