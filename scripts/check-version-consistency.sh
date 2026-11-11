#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 校园行 CampusGo · 版本一致性校验（M1 · 非阻塞报告）
#
# 用途：对比当前 HEAD 与基准 tag `v0.1-baseline`、集成主线 `origin/develop`，
#       输出可读的 pass/fail 结论，帮助发现三方私有桌面的版本分叉。
#
# 用法：
#   bash scripts/check-version-consistency.sh
#   pnpm run check:versions
#
# 说明（M1）：
#   - 本脚本刻意 **不** 作为放行门禁：feature 分支的 HEAD 本就领先 develop，
#     "HEAD != origin/develop" 是预期状态，不应报 fail 阻断流程。
#   - CI 里该步骤以 continue-on-error 运行，仅输出报告。
#   - TODO(M3)：改造成「三方 HEAD 指向同一提交才放行」的硬门禁
#     （比对三方 feature 分支 tip 是否一致，不一致则 exit 1）。
#
# 退出码：始终为 0（M1 非阻塞）；引用缺失时给出 WARN 并降级，不误报失败。
# ---------------------------------------------------------------------------
set -u

# ASCII 输出，避免不同 locale 下对齐/编码问题。
PASS="[PASS]"
FAIL="[FAIL]"
WARN="[WARN]"
INFO="[INFO]"

divider() { printf '%s\n' "------------------------------------------------------------"; }

# 解析一个 git 引用为提交 hash；解析不到返回空串。
resolve() {
  git rev-parse --verify --quiet "$1^{commit}" 2>/dev/null || true
}

short() { git rev-parse --short "$1" 2>/dev/null || printf '%s' "$1"; }

divider
printf ' CampusGo · 版本一致性校验（M1 报告，非阻塞）\n'
divider

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '%s 当前目录不是 git 工作树，无法校验。请在仓库根目录运行。\n' "$FAIL"
  divider
  exit 0
fi

HEAD_SHA="$(resolve HEAD)"
if [ -z "$HEAD_SHA" ]; then
  printf '%s 无法解析 HEAD（空仓库？）。\n' "$FAIL"
  divider
  exit 0
fi
BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || printf 'detached@%s' "$(short HEAD)")"
printf '%s 当前 HEAD            : %s (%s)\n' "$INFO" "$HEAD_SHA" "$(git log -1 --format=%s 2>/dev/null | cut -c1-60)"
printf '%s 当前分支            : %s\n' "$INFO" "$BRANCH"
printf '\n'

overall_warn=0

# ---- 与基准 tag 对比 -------------------------------------------------------
BASELINE_SHA="$(resolve v0.1-baseline)"
if [ -n "$BASELINE_SHA" ]; then
  printf '%s 基准 v0.1-baseline   : %s\n' "$INFO" "$BASELINE_SHA"
  if git merge-base --is-ancestor "$BASELINE_SHA" "$HEAD_SHA" 2>/dev/null; then
    if [ "$HEAD_SHA" = "$BASELINE_SHA" ]; then
      printf '%s 与基准一致：当前 HEAD 正是基准提交（全新开工）。\n' "$PASS"
    else
      AHEAD="$(git rev-list --count "$BASELINE_SHA..$HEAD_SHA" 2>/dev/null || echo '?')"
      printf '%s 基于基准开发：HEAD 领先基准 %s 个提交，未发生版本分叉。\n' "$PASS" "$AHEAD"
    fi
  else
    printf '%s 版本分叉：基准提交不是当前 HEAD 的祖先，可能取错基准或已 rebase 越界。\n' "$FAIL"
    overall_warn=1
  fi
else
  printf '%s 未找到 tag v0.1-baseline（本地未 fetch tag？）；跳过基准对比。\n' "$WARN"
  printf '%s 提示：git fetch --tags 后再运行本脚本。\n' "$INFO"
  overall_warn=1
fi
printf '\n'

# ---- 与 origin/develop 对比 ------------------------------------------------
DEVELOP_SHA="$(resolve origin/develop)"
if [ -n "$DEVELOP_SHA" ]; then
  printf '%s origin/develop        : %s\n' "$INFO" "$DEVELOP_SHA"
  if [ "$HEAD_SHA" = "$DEVELOP_SHA" ]; then
    printf '%s 与 develop 完全一致：三方已合流到同一提交。\n' "$PASS"
  else
    MERGE_BASE="$(git merge-base "$HEAD_SHA" "$DEVELOP_SHA" 2>/dev/null || true)"
    if [ -n "$MERGE_BASE" ]; then
      AHEAD_D="$(git rev-list --count "$DEVELOP_SHA..$HEAD_SHA" 2>/dev/null || echo '?')"
      BEHIND_D="$(git rev-list --count "$HEAD_SHA..$DEVELOP_SHA" 2>/dev/null || echo '?')"
      printf '%s 与 develop 分叉（M1 feature 分支预期）：HEAD 领先 %s、落后 %s 个提交。\n' "$WARN" "$AHEAD_D" "$BEHIND_D"
      printf '%s 共同祖先            : %s\n' "$INFO" "$MERGE_BASE"
      printf '%s 合流建议：git fetch origin && git rebase origin/develop 后重跑本脚本。\n' "$INFO"
    else
      printf '%s 与 develop 无共同祖先，取码基准可能不对，请核对远程仓。\n' "$FAIL"
      overall_warn=1
    fi
  fi
else
  printf '%s 未找到 origin/develop（本地未 fetch？）；跳过 develop 对比。\n' "$WARN"
  printf '%s 提示：git fetch origin 后再运行本脚本。\n' "$INFO"
  overall_warn=1
fi
printf '\n'

# ---- 工作区整洁度（附加信息，不影响结论）----------------------------------
if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  printf '%s 工作区整洁：无未提交改动。\n' "$PASS"
else
  printf '%s 工作区存在未提交改动（提交/推送前请确认）。\n' "$WARN"
fi

divider
if [ "$overall_warn" -eq 0 ]; then
  printf ' 结论：PASS — 版本链可追溯，未发现异常分叉。\n'
else
  printf ' 结论：NEEDS ATTENTION — 见上方 WARN/FAIL 行（M1 非阻塞，仅供核对）。\n'
fi
printf ' 这是 M1 报告，不是放行门禁；M3 将升级为「三方同提交」硬门禁。\n'
divider

# M1 始终返回 0：报告性质，绝不阻断 CI/本地流程。
exit 0
