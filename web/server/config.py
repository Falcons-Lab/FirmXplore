"""Web 应用运行时配置。

所有可调参数通过环境变量注入（Docker / docker-compose 中覆盖），
默认值面向单机部署场景。统一前缀 FIRMXPLORE_；
旧部署使用的 WEB_ 前缀仍被兼容读取（优先级低于新前缀）。
"""
from __future__ import annotations

import os
from pathlib import Path

# 项目根目录（FirmXplore 仓库根，包含 fwagent 内部包）
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _env(name: str, default: str) -> str:
    """读环境变量：FIRMXPLORE_ 前缀优先，WEB_ 前缀兼容回退。"""
    return os.environ.get(f"FIRMXPLORE_{name}", os.environ.get(f"WEB_{name}", default))


# fwagent 分析工作区：任务产物、报告都写到 workspace/{task_id}/ 下，
# 与 CLI 的默认 workspace 目录保持一致，两边可以互相查看结果。
WORKSPACE_ROOT = Path(_env("WORKSPACE_ROOT", str(PROJECT_ROOT / "workspace")))

# 上传的固件暂存目录
UPLOAD_ROOT = Path(_env("UPLOAD_ROOT", str(PROJECT_ROOT / "web" / "data" / "uploads")))

# SQLite 数据库文件
DATABASE_URL = _env("DATABASE_URL", f"sqlite:///{(PROJECT_ROOT / 'web' / 'data' / 'firmxplore.db').as_posix()}")

# CORS：开发环境下 Vite 默认跑在 5173
CORS_ORIGINS = [o.strip() for o in _env("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

# 上传限制
MAX_UPLOAD_SIZE_MB = int(_env("MAX_UPLOAD_MB", "1024"))
ALLOWED_EXTENSIONS = {
    ".bin", ".img", ".rom", ".fw", ".trx", ".bin",
    ".zip", ".rar", ".7z", ".gz", ".bz2", ".xz", ".lzma", ".zst",
    ".tar", ".cpio", ".squashfs", ".ubi", ".ubifs", ".jffs2", ".crfs", ".yaffs2",
}

# API Key 加密密钥：优先从环境变量读取；否则自动生成并持久化到该文件。
# 生产环境务必通过 FIRMXPLORE_SECRET_KEY 显式设置，避免密钥文件丢失后无法解密。
SECRET_KEY_FILE = PROJECT_ROOT / "web" / "data" / ".secret_key"

# 任务保留天数：超过后由后台清理协程删除（0 表示不清理）
RETENTION_DAYS = int(_env("RETENTION_DAYS", "7"))

# 单机同时运行的分析任务数（fwagent 分析会启动 Docker/Ghidra 等重负载子进程）
MAX_CONCURRENT_TASKS = int(_env("MAX_CONCURRENT_TASKS", "1"))

# SSE 推送间隔 / 进度轮询间隔（秒）
PROGRESS_POLL_INTERVAL = float(_env("PROGRESS_POLL_INTERVAL", "2"))
