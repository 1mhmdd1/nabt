#!/usr/bin/env bash
set -u
BASE="http://127.0.0.1:43123"
OUT="/opt/cursor/artifacts/screens"
mkdir -p "$OUT" /tmp/shots
cd /workspace

capture() {
  local name="$1"
  local path="$2"
  local dest="$OUT/${name}.png"
  echo "CAPTURE $name $path"
  if timeout 60 node scripts/capture-one.mjs "${BASE}${path}" "$dest"; then
    echo "OK $name"
  else
    echo "FAIL $name (exit $?)"
  fi
}

capture launch "/?hold=1"
capture understand "/onboarding?step=0"
capture support "/onboarding?step=1"
capture find "/onboarding?step=2"
capture verify "/onboarding?step=3"
capture scan "/signup/scan"
capture details "/signup/details"
capture email "/signup/email"
capture nickname "/signup/nickname"
capture pending "/signup/pending"
capture login "/login"
capture home "/home"
capture checkin "/check-in"
capture chats "/chats"
capture circle "/circle/exam-week"
capture chat "/circle/exam-week/chat"
capture me "/me"
capture settings "/settings"
capture accessibility "/settings/accessibility"
echo "DONE"
