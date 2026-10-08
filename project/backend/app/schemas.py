from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from .models import CredentialKind, DiscrepancyStatus, DiscrepancyType, Platform


class AccountOut(BaseModel):
    id: int
    name: str
    inn: str


class CredentialIn(BaseModel):
    account_id: int
    kind: CredentialKind
    label: str = ""
    secret: str
    expires_at: Optional[date] = None


class CredentialOut(BaseModel):
    id: int
    kind: CredentialKind
    label: str
    hint: str
    expires_at: Optional[date]
    days_left: Optional[int]
    last_check_at: Optional[datetime]
    last_check_ok: Optional[bool]
    last_check_message: str


class PlatformItemOut(BaseModel):
    id: int
    platform: Platform
    external_id: str
    offer_code: str
    barcode: str
    name: str
    price: float
    product_id: Optional[int]
    match_source: str


class ProductOut(BaseModel):
    id: int
    gtin: str
    name: str
    cost_price: float
    stock: int
    codes_introduced: int
    codes_frozen: int
    platforms: list[Platform]
    items: list[PlatformItemOut]


class MatchRequest(BaseModel):
    item_id: int
    product_id: Optional[int] = None


class DiscrepancyOut(BaseModel):
    id: int
    type: DiscrepancyType
    type_title: str
    product_id: Optional[int]
    product_name: str
    gtin: str
    qty: int
    amount: float
    comment: str
    status: DiscrepancyStatus
    detected_at: datetime


class DiscrepancyPatch(BaseModel):
    status: DiscrepancyStatus


class DashboardSummary(BaseModel):
    account: Optional[AccountOut]
    as_of: Optional[datetime]
    products_total: int
    items_unmatched: int
    stock_total: int
    codes_introduced: int
    discrepancies_open: int
    amount_at_risk: float
    by_type: list[dict]
    credentials_expiring: list[CredentialOut]
