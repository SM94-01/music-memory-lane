#!/usr/bin/env bash
# Removes macOS / iCloud duplicate files from android/app/src/main/res that
# break the Android resource compiler (aapt2). Run before `./gradlew` if you
# see: "File-based resource names must contain only lowercase a-z, 0-9,
# or underscore".
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)/app/src/main/res"
echo "Scanning $DIR ..."
find "$DIR" -type f \( -name "* *" -o -name "*[A-Z]*.xml" -o -name "*[A-Z]*.png" \) -print -delete
echo "Done."
