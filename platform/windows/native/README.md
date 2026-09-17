# platform/windows/native (deferred — keep empty)

Boundary for a SMALL native helper if (and only if) a spike proves WinRT/Node cannot do it: master-volume (`IAudioEndpointVolume`), capture-session enumeration for mic heuristics.

Rules: no code lands here without an ADR + spike result; prebuilt binaries never committed (build in CI); consumers talk through a versioned JS façade so the helper stays replaceable.
