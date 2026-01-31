from dataclasses import dataclass
from typing import Optional, Dict, Any
import os
import asyncio
from surrealdb import SurrealDB


@dataclass
class DBConfig:
    url: str = None
    namespace: str = None
    database: str = None
    user: str = None
    password: str = None

    def __post_init__(self):
        if self.url is None:
            self.url = os.getenv("SURREALDB_URL", "localhost:8000")
        if self.namespace is None:
            self.namespace = os.getenv("SURREALDB_NS", "buildscale")
        if self.database is None:
            self.database = os.getenv("SURREALDB_DB", "main")
        if self.user is None:
            self.user = os.getenv("SURREALDB_USER", "root")
        if self.password is None:
            self.password = os.getenv("SURREALDB_PASS", "root")


class SurrealDBClient:
    def __init__(self, config: DBConfig = None):
        self.config = config or DBConfig()
        self.client: Optional[SurrealDB] = None
        self.connected = False

    async def connect(self):
        if self.client and self.connected:
            return
        self.client = SurrealDB(self.config.url)
        await self.client.connect()
        await self.client.use(self.config.namespace, self.database)
        if self.config.user and self.config.password:
            await self.client.signin(
                {"user": self.config.user, "pass": self.config.password}
            )
        self.connected = True

    async def query(self, sql: str, params: Dict[str, Any] = None):
        if not self.client:
            await self.connect()
        # SurrealDB client supports async and concurrent queries
        # Connection pooling is handled by the client's underlying connection management
        result = await self.client.query(sql, params or {})
        return result

    async def close(self):
        if self.client:
            await self.client.close()
            self.connected = False


# Global client
db_client = SurrealDBClient()
