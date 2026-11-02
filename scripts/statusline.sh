#!/bin/sh
# Claude Code statusLine — robbyrussell theme + context/rate-limit bars + caveman badge.
# Receives JSON on stdin. Needs jq and git.

input=$(cat)

# Read every field in one jq pass, tab-separated, instead of one subshell per field.
IFS='	' read -r cwd model effort thinking ctx rl5 rl5_at rl7 rl7_at added removed <<EOF
$(echo "$input" | jq -r '[
  (.workspace.current_dir // .cwd // ""),
  (.model.display_name // ""),
  (.effort.level // ""),
  (.thinking.enabled // false | tostring),
  (.context_window.used_percentage // ""),
  (.rate_limits.five_hour.used_percentage // ""),
  (.rate_limits.five_hour.resets_at // ""),
  (.rate_limits.seven_day.used_percentage // ""),
  (.rate_limits.seven_day.resets_at // ""),
  (.cost.total_lines_added // 0),
  (.cost.total_lines_removed // 0)
] | @tsv')
EOF

dirname=$(basename "$cwd")
branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
dirty=$(git -C "$cwd" --no-optional-locks status --porcelain 2>/dev/null | head -1)

# ANSI palette
reset='\033[0m'
bold_green='\033[1;32m'
cyan='\033[0;36m'
bold_blue='\033[1;34m'
red='\033[0;31m'
blue='\033[0;34m'
yellow='\033[0;33m'
bold_magenta='\033[1;35m'
green='\033[0;32m'
dim='\033[2;37m'
orange='\033[38;5;172m'

# ---- helper: 10-segment bar, color by pct ----
draw_bar() {
  pct=$1
  [ -z "$pct" ] && pct=0
  filled=$(( (pct + 5) / 10 ))
  [ "$filled" -gt 10 ] && filled=10
  [ "$filled" -lt 0 ] && filled=0
  empty=$(( 10 - filled ))
  if [ "$pct" -ge 80 ]; then c="$red"
  elif [ "$pct" -ge 50 ]; then c="$yellow"
  else c="$green"; fi
  printf "%b" "$c"
  i=0; while [ "$i" -lt "$filled" ]; do printf "█"; i=$((i+1)); done
  printf "%b" "$dim"
  i=0; while [ "$i" -lt "$empty" ]; do printf "░"; i=$((i+1)); done
  printf "%b" "$reset"
}

# ---- helper: epoch -> "2h14m" left ----
time_left() {
  [ -z "$1" ] && return
  left=$(( $1 - $(date +%s) ))
  [ "$left" -le 0 ] && return
  h=$(( left / 3600 )); m=$(( (left % 3600) / 60 ))
  if [ "$h" -gt 24 ]; then printf "%dd%dh" $(( h / 24 )) $(( h % 24 ))
  elif [ "$h" -gt 0 ]; then printf "%dh%dm" "$h" "$m"
  else printf "%dm" "$m"; fi
}

# ---- helper: labelled bar + pct + optional reset countdown ----
meter() {
  [ -z "$2" ] && return
  printf "  ${dim}%s${reset} " "$1"; draw_bar "$2"; printf " ${dim}%s%%${reset}" "$2"
  t=$(time_left "$3")
  [ -n "$t" ] && printf "${dim}·%s${reset}" "$t"
}

# ===== LINE 1: arrow + dir + git + model + effort =====
printf "${bold_green}➜${reset} "
printf "${cyan}%s${reset}" "$dirname"
if [ -n "$branch" ]; then
  printf " ${bold_blue}git:(${red}%s" "$branch"
  if [ -n "$dirty" ]; then printf "${yellow} ✗${blue})${reset}"; else printf "${blue})${reset}"; fi
fi
if [ -n "$model" ]; then
  printf " ${bold_magenta}[%s" "$model"
  [ -n "$effort" ] && printf "${dim}·%s" "$effort"
  [ "$thinking" = "true" ] && printf "${dim}·🧠"
  printf "${bold_magenta}]${reset}"
fi
printf "\n"

# ===== LINE 2: context + rate limits + diff + caveman =====
if [ -n "$ctx" ]; then
  printf "${dim}ctx${reset} "; draw_bar "$ctx"; printf " ${dim}%s%%${reset}" "$ctx"
fi
meter "5h" "$rl5" "$rl5_at"
meter "7d" "$rl7" "$rl7_at"
[ "$added" != "0" ] || [ "$removed" != "0" ] && \
  printf "  ${dim}(${green}+%s${dim}/${red}-%s${dim})${reset}" "$added" "$removed"

# Caveman badge: does nothing unless ~/.claude/.caveman-active exists.
FLAG="$HOME/.claude/.caveman-active"
if [ -f "$FLAG" ] && [ ! -L "$FLAG" ]; then
  MODE=$(head -c 64 "$FLAG" 2>/dev/null | tr -d '\n\r' | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')
  case "$MODE" in
    full|"") printf "  ${orange}[CAVEMAN]${reset}" ;;
    off) ;;
    lite|ultra|wenyan-lite|wenyan|wenyan-full|wenyan-ultra|commit|review|compress)
      printf "  ${orange}[CAVEMAN:%s]${reset}" "$(printf '%s' "$MODE" | tr 'a-z' 'A-Z')" ;;
  esac
fi
printf "\n"
