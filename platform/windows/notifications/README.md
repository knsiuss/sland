# platform/windows/notifications (P4)

`UserNotificationListener` mirror (explicit opt-in UX; `RequestAccessAsync` on UI thread; revoked = empty list = "no data", never crash) + outbound phase-complete toasts (`new Notification`, Windows ToastNotifications).

Spike gate: listen with permission denied vs granted.
