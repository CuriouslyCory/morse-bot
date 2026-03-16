# Sample Audio Index

Reference files for testing morse code decoding.

## Fields

- **File**: filename relative to `sample-audio/`
- **Text**: decoded plain-text content
- **Morse**: dot/dash representation (`·` = dit, `−` = dah, `/` = letter gap, `//` = word gap)
- **WPM**: words per minute (standard PARIS timing)
- **Frequency (Hz)**: tone pitch
- **Format**: audio format and sample rate

## Files

| File            | Text                                     | Morse                                                                                                                                           | WPM | Frequency (Hz) | Format             |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------- | ------------------ |
| morse-test1.wav | Hi. How are you?                         | `.... .. .-.-.- / .... --- .-- / .- .-. . / -.-- --- ..- ..--..`                                                                                | 20  | 550            | WAV 16-bit 44100Hz |
| morse-test2.wav | The orange fox jumps over the brown log. | `- .... . / --- .-. .- -. --. . / ..-. --- -..- / .--- ..- -- .--. ... / --- ...- . .-. / - .... . / -... .-. --- .-- -. / .-.. --- --. .-.-.-` | 25  | 600            | WAV 16-bit 44100Hz |
| morse-test3.wav | Where is the bacon?                      | `.-- .... . .-. . / .. ... / - .... . / -... .- -.-. --- -. ..--..`                                                                             | 15  | 800            | WAV 16-bit 44100Hz |
