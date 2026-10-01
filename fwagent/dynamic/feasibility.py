"""动态验证可行性静态评估（P2-2）。

在确定性流水线早期（rootfs 就绪后）基于固件架构 / 字节序 / init 脚本
评估 QEMU 仿真的可行性，写入 dynamic/feasibility.json。
报告读取该文件，把笼统的 "not_assessed" 替换为具体原因。
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# qemu-user-static 支持的用户态架构
QEMU_USER_SUPPORTED = {
    "arm", "armel", "armhf", "aarch64",
    "mips", "mipsel", "mips64", "mips64el",
    "x86", "x86_64", "riscv32", "riscv64",
    "ppc", "ppc64", "ppc64le", "m68k", "sh4",
}


def assess(analysis: dict[str, Any], task_dir: Path) -> dict[str, Any]:
    """从 analysis.json 的 platform/extraction 评估动态验证可行性。"""
    platform = analysis.get("platform") or {}
    arch = str(platform.get("architecture") or "unknown").lower()
    endian = str(platform.get("endianness") or "unknown").lower()

    reasons: list[str] = []
    feasible = True

    if arch == "unknown":
        feasible = False
        reasons.append("architecture not identified; qemu-user target unknown")
    elif arch not in QEMU_USER_SUPPORTED:
        feasible = False
        reasons.append(f"arch '{arch}' not supported by qemu-user")
    if arch.startswith("mips") and endian == "big":
        reasons.append("big-endian MIPS: qemu-user works but needs a matching sysroot")

    rootfs = str((analysis.get("extraction") or {}).get("rootfs") or "")
    has_init = False
    if rootfs:
        rootfs_path = Path(rootfs)
        has_init = (rootfs_path / "etc/init.d").is_dir() or (rootfs_path / "sbin/init").exists()
    if rootfs and not has_init:
        reasons.append("no init script found (etc/init.d or sbin/init); service startup not reproducible")

    return {
        "feasible": feasible,
        "assessment": "feasible" if feasible else "not_feasible",
        "arch": arch,
        "endianness": endian,
        "init_scripts_found": has_init,
        "reasons": reasons,
        "method": "static_heuristic",
    }


def write_if_missing(task_dir: Path) -> dict[str, Any] | None:
    """动态阶段尚未写 runtime_summary 时，落一份静态可行性评估。

    已存在（动态阶段已评估过）时不覆盖。
    """
    out = task_dir / "dynamic" / "feasibility.json"
    if out.exists():
        return None
    analysis_path = task_dir / "reports" / "analysis.json"
    if not analysis_path.exists():
        return None
    try:
        analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
        result = assess(analysis, task_dir)
    except (OSError, json.JSONDecodeError):
        return None
    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2, sort_keys=True), encoding="utf-8")
    except OSError:
        return None
    return result
