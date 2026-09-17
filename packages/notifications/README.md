# packages/notifications (P4)

Transient notifications (`NOTIFY.RECEIVED`, default 4000ms, cancel-on-exit, history restore). Reading OS toasts requires explicit user consent (`UserNotificationListener`); denied/revoked permission = empty list treated as "no data", never a crash. GitHub v1 = deep-link + optional REST with user token (live sync deferred).
