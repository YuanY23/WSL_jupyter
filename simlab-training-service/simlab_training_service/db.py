from __future__ import annotations

from collections.abc import Generator
from typing import Any

from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool


Base = declarative_base()


def make_session_factory(database_url: str, **kwargs: Any):
    engine_kwargs: dict[str, Any] = {"future": True}
    engine_kwargs.update(kwargs)
    if database_url == "sqlite://":
        engine_kwargs.setdefault("poolclass", StaticPool)
        engine_kwargs.setdefault("connect_args", {"check_same_thread": False})
    elif database_url.startswith("sqlite"):
        engine_kwargs.setdefault("connect_args", {"check_same_thread": False})
    engine = create_engine(database_url, **engine_kwargs)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True), engine


def get_db(request: Request) -> Generator[Session, None, None]:
    session_factory = request.app.state.session_factory
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
