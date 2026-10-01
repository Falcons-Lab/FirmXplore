"""API Key 加密存储。

使用 cryptography.fernet 对称加密。密钥来源：
1. 环境变量 WEB_SECRET_KEY（生产推荐，32 字节 url-safe base64）；
2. 未设置时自动生成并写入 web/data/.secret_key 文件（单机开发用）。

如需更换密钥，请同时清空 app_config 表中的 api_key 记录。
"""
from __future__ import annotations

import base64
import os

from cryptography.fernet import Fernet, InvalidToken

from . import config

_fernet: Fernet | None = None


def _load_or_create_key() -> bytes:
    # FIRMXPLORE_SECRET_KEY 优先，WEB_SECRET_KEY 兼容旧部署
    env_key = os.environ.get("FIRMXPLORE_SECRET_KEY") or os.environ.get("WEB_SECRET_KEY")
    if env_key:
        return base64.urlsafe_b64encode(env_key.encode() if len(env_key) == 44 else env_key.encode().ljust(32)[:32])
    path = config.SECRET_KEY_FILE
    if path.exists():
        return path.read_bytes().strip()
    key = Fernet.generate_key()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(key)
    try:
        path.chmod(0o600)
    except OSError:
        pass
    return key


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_load_or_create_key())
    return _fernet


def encrypt(plaintext: str) -> str:
    return get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str | None:
    """解密失败（密钥更换/记录损坏）时返回 None 而不是抛异常，调用方按未配置处理。"""
    try:
        return get_fernet().decrypt(ciphertext.encode()).decode()
    except (InvalidToken, ValueError):
        return None
