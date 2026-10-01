"""SQLAlchemy 引擎与会话管理。"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from . import config

# check_same_thread=False：分析任务在工作线程中更新任务状态，
# 多线程共享同一个引擎，由 SessionLocal 为每个线程创建独立连接。
engine = create_engine(
    config.DATABASE_URL,
    connect_args={"check_same_thread": False} if config.DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """建表；由 main.py 在启动时调用。"""
    from . import models  # noqa: F401  确保模型已注册

    config.UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    config.WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI 依赖：请求级数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
