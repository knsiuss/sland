# integrations/spotify

Thin veneer over `platform/windows/media`: Spotify display quirks (artwork size, timeline gaps) + `spotify:` URI launch. Transport stays generic GSMTC — if Spotify-specific transport code starts growing here, that is a design smell: push it down to the provider.
