#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SITE_URL="https://semicommhub.com"
OUTPUT_FILE="feed.xml"
NOW_RFC822="$(date -u '+%a, %d %b %Y %H:%M:%S GMT')"

# Pages that represent publishable SemiComm content.
mapfile -t CONTENT_PAGES < <(find . -maxdepth 1 -type f -name '*.html' \
  ! -name 'index.html' \
  ! -name 'contact.html' \
  ! -name 'services.html' \
  ! -name 'authors.html' \
  ! -name 'analytics.html' \
  -printf '%f\n' | sort)

escape_xml() {
  local text="$1"
  text="${text//&/&amp;}"
  text="${text//</&lt;}"
  text="${text//>/&gt;}"
  text="${text//\"/&quot;}"
  printf '%s' "$text"
}

extract_first_match() {
  local file="$1"
  local pattern="$2"
  grep -i -m1 "$pattern" "$file" || true
}

build_item_row() {
  local file="$1"

  local title
  title="$(extract_first_match "$file" '<title>')"
  title="$(printf '%s' "$title" | sed -E 's:.*<title>(.*)</title>.*:\1:I')"

  if [[ -z "$title" ]]; then
    title="$(basename "$file" .html | tr '-' ' ')"
  fi

  local description="SemiComm update published in ${file}."

  local git_meta commit_sha commit_iso commit_rss
  git_meta="$(git log -1 --format='%H|%cI|%cD' -- "$file" 2>/dev/null || true)"

  if [[ -n "$git_meta" ]]; then
    commit_sha="${git_meta%%|*}"
    local rest
    rest="${git_meta#*|}"
    commit_iso="${rest%%|*}"
    commit_rss="${rest#*|}"
  else
    commit_sha="$(date -u +%s)-${file}"
    commit_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    commit_rss="$NOW_RFC822"
  fi

  local link="${SITE_URL}/${file}"
  local guid="${link}?v=${commit_sha}"

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$commit_iso" \
    "$(escape_xml "$title")" \
    "$(escape_xml "$description")" \
    "$link" \
    "$guid" \
    "$commit_rss"
}

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<rss version="2.0">'
  echo '  <channel>'
  echo '    <title>SemiComm Global Updates</title>'
  echo '    <link>https://semicommhub.com/</link>'
  echo '    <description>New and updated SemiComm posts across trending, articles, about, and insight pages.</description>'
  echo '    <language>en-us</language>'
  echo "    <lastBuildDate>${NOW_RFC822}</lastBuildDate>"

  while IFS=$'\t' read -r _iso title description link guid pub_date; do
    echo '    <item>'
    echo "      <title>${title}</title>"
    echo "      <link>${link}</link>"
    echo "      <guid isPermaLink=\"false\">${guid}</guid>"
    echo "      <pubDate>${pub_date}</pubDate>"
    echo "      <description>${description}</description>"
    echo '    </item>'
  done < <(
    for page in "${CONTENT_PAGES[@]}"; do
      build_item_row "$page"
    done | sort -r -t $'\t' -k1,1
  )

  echo '  </channel>'
  echo '</rss>'
} > "$OUTPUT_FILE"

echo "Generated ${OUTPUT_FILE} with ${#CONTENT_PAGES[@]} items."
