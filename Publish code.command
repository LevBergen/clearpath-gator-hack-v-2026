#!/bin/zsh
set -eu
cd "$(dirname "$0")"
echo "Publish the reviewed Clearpath code to a PUBLIC GitHub repository."
echo "This does not deploy the app or submit to Devpost."
echo "Your .env, local build files, and demo video are excluded from Git."
echo ""
if ! command -v gh >/dev/null; then
  echo "GitHub CLI is required. Ask Codex to prepare it, then try again."
  read -r "reply?Press Return to close. "
  exit 1
fi
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "There are uncommitted files. Have Codex review and save the final source first."
  read -r "reply?Press Return to close. "
  exit 1
fi
if git remote get-url origin >/dev/null 2>&1; then
  echo "This checkout already has a GitHub remote. Nothing changed."
  read -r "reply?Press Return to close. "
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "Sign in with gh auth login in Terminal, then open this file again."
  read -r "reply?Press Return to close. "
  exit 1
fi
echo "Repository name: clearpath-gator-hack-v-2026"
read -r "reply?Type PUBLISH to make the code public, or anything else to cancel: "
if [ "$reply" != "PUBLISH" ]; then exit 0; fi
gh repo create clearpath-gator-hack-v-2026 --public --source=. --push --description "Clearpath: application question coaching with Gemma 4. Built at Gator Hack V 2026."
echo ""
echo "Code published. Return to Codex with the repository URL to prepare the hosted demo."
read -r "reply?Press Return to close. "
