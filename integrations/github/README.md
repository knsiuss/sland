# integrations/github

v1 = notification tap → repo/PR deep-link (+ optional REST polling ONLY with a user-supplied token stored in the OS credential store, never `config.json`). Live GitHub presence is deferred. Token handling follows SEC-003; every network call needs explicit permission (AI-SEC-004 pattern applies to any future agent use).
