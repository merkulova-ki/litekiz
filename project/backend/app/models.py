from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class Platform(str, Enum):
    wb = "wb"
    ozon = "ozon"


class CredentialKind(str, Enum):
    wb = "wb"
    ozon = "ozon"
    gismt = "gismt"


class CisStatus(str, Enum):
    emitted = "EMITTED"
    applied = "APPLIED"
    introduced = "INTRODUCED"
    retired = "RETIRED"


class DiscrepancyType(str, Enum):
    code_without_stock = "CODE_WITHOUT_STOCK"
    stock_without_code = "STOCK_WITHOUT_CODE"
    frozen_codes = "FROZEN_CODES"
    return_not_reintroduced = "RETURN_NOT_REINTRODUCED"


class DiscrepancyStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    resolved = "resolved"
    ignored = "ignored"


class Account(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    inn: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Credential(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    kind: CredentialKind
    label: str = ""
    secret_encrypted: str
    hint: str = ""
    expires_at: Optional[date] = None
    last_check_at: Optional[datetime] = None
    last_check_ok: Optional[bool] = None
    last_check_message: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    gtin: str = Field(index=True)
    name: str
    product_group: str = ""
    cost_price: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PlatformItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    platform: Platform
    external_id: str
    offer_code: str
    barcode: str = Field(index=True)
    name: str
    price: float = 0.0
    product_id: Optional[int] = Field(default=None, foreign_key="product.id", index=True)
    match_source: str = ""
    synced_at: datetime = Field(default_factory=datetime.utcnow)


class StockSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    platform: Platform
    platform_item_id: int = Field(foreign_key="platformitem.id", index=True)
    warehouse: str
    scheme: str = "FBO"
    qty: int = 0
    taken_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class OrderRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    platform: Platform
    platform_item_id: int = Field(foreign_key="platformitem.id", index=True)
    external_order_id: str
    qty: int = 1
    price: float = 0.0
    is_return: bool = False
    happened_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Cis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    cis: str = Field(index=True, unique=True)
    gtin: str = Field(index=True)
    status: CisStatus
    status_changed_at: datetime = Field(default_factory=datetime.utcnow)
    synced_at: datetime = Field(default_factory=datetime.utcnow)


class Discrepancy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id", index=True)
    type: DiscrepancyType
    qty: int = 0
    amount: float = 0.0
    comment: str = ""
    status: DiscrepancyStatus = DiscrepancyStatus.new
    detected_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class SyncRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: Optional[int] = Field(default=None, foreign_key="account.id", index=True)
    kind: str
    status: str = "ok"
    message: str = ""
    duration_ms: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow, index=True)
