import random
from datetime import datetime, timedelta

from sqlmodel import Session, delete, select

from .matching import barcode_to_gtin
from .models import (
    Account,
    Cis,
    CisStatus,
    Credential,
    Discrepancy,
    OrderRow,
    Platform,
    PlatformItem,
    Product,
    StockSnapshot,
    SyncRun,
)

CATEGORIES = [
    ("Футболка хлопок", "TSH", 1290),
    ("Худи оверсайз", "HOD", 3490),
    ("Джинсы прямые", "JNS", 4190),
    ("Кроссовки беговые", "SNK", 5990),
    ("Куртка ветровка", "JCK", 4790),
    ("Платье миди", "DRS", 3290),
    ("Рубашка оксфорд", "SHR", 2490),
    ("Свитшот базовый", "SWT", 2790),
    ("Брюки карго", "PNT", 3590),
    ("Шорты спортивные", "SHT", 1590),
    ("Юбка плиссе", "SKR", 2890),
    ("Пиджак приталенный", "BLZ", 6490),
]
COLORS = ["черный", "белый", "синий", "бежевый", "серый"]
SIZES = ["S", "M", "L", "XL"]
WAREHOUSES_WB = ["Коледино", "Электросталь", "Казань"]
WAREHOUSES_OZON = ["Хоругвино", "Твери", "Екатеринбург"]


def reset(session: Session) -> None:
    for model in (Discrepancy, StockSnapshot, OrderRow, Cis, PlatformItem, Product, Credential, SyncRun, Account):
        session.exec(delete(model))
    session.commit()


def seed(session: Session, products_count: int = 18, seed_value: int = 42) -> dict:
    started = datetime.utcnow()
    rnd = random.Random(seed_value)
    reset(session)

    account = Account(name="ИП Смирнова А. В.", inn="770912345678")
    session.add(account)
    session.flush()

    _seed_credentials(session, account.id)

    now = datetime.utcnow()
    items_by_product_key: dict[str, list[PlatformItem]] = {}

    for index in range(products_count):
        base_name, code, base_price = CATEGORIES[index % len(CATEGORIES)]
        color = rnd.choice(COLORS)
        size = rnd.choice(SIZES)
        title = f"{base_name}, {color}, {size}"
        offer_code = f"{code}-{100 + index}"
        barcode = f"46{rnd.randint(10**9, 10**10 - 1)}"
        price = base_price + rnd.randint(-300, 700)

        scenario = _scenario_for(index)
        created: list[PlatformItem] = []

        if scenario in ("both_barcode", "both_offer"):
            wb_barcode = barcode
            ozon_barcode = barcode if scenario == "both_barcode" else f"46{rnd.randint(10**9, 10**10 - 1)}"
            created.append(_make_item(session, account.id, Platform.wb, index, title, offer_code, wb_barcode, price))
            created.append(_make_item(session, account.id, Platform.ozon, index, title, offer_code, ozon_barcode, price))
        elif scenario == "wb_only":
            created.append(_make_item(session, account.id, Platform.wb, index, title, offer_code, barcode, price))
        else:
            created.append(_make_item(session, account.id, Platform.ozon, index, title, offer_code, barcode, price))

        session.flush()
        items_by_product_key[offer_code] = created

        stock_total = rnd.randint(0, 60)
        _seed_stocks(session, account.id, created, stock_total, now, rnd)

        _seed_orders(session, account.id, created, now, rnd, price)

        _seed_codes(session, account.id, created, stock_total, now, rnd, index)

    session.add(
        SyncRun(
            account_id=account.id,
            kind="demo_seed",
            message=f"товаров: {products_count}",
            duration_ms=int((datetime.utcnow() - started).total_seconds() * 1000),
        )
    )
    session.commit()

    return {
        "account_id": account.id,
        "platform_items": len(session.exec(select(PlatformItem)).all()),
        "codes": len(session.exec(select(Cis)).all()),
    }


def _scenario_for(index: int) -> str:
    remainder = index % 8
    if remainder in (0, 1, 2, 3):
        return "both_barcode"
    if remainder in (4, 5):
        return "both_offer"
    if remainder == 6:
        return "wb_only"
    return "ozon_only"


def _make_item(
    session: Session,
    account_id: int,
    platform: Platform,
    index: int,
    title: str,
    offer_code: str,
    barcode: str,
    price: float,
) -> PlatformItem:
    external_id = f"{'nm' if platform == Platform.wb else 'oz'}{200000 + index * 7}"
    item = PlatformItem(
        account_id=account_id,
        platform=platform,
        external_id=external_id,
        offer_code=offer_code,
        barcode=barcode,
        name=title,
        price=price,
    )
    session.add(item)
    return item


def _seed_stocks(session, account_id, items, total, now, rnd) -> None:
    if not items:
        return
    per_item = max(total // len(items), 0)
    for item in items:
        warehouses = WAREHOUSES_WB if item.platform == Platform.wb else WAREHOUSES_OZON
        left = per_item
        for warehouse in rnd.sample(warehouses, k=rnd.randint(1, 2)):
            qty = rnd.randint(0, left) if left > 0 else 0
            left -= qty
            session.add(
                StockSnapshot(
                    account_id=account_id,
                    platform=item.platform,
                    platform_item_id=item.id,
                    warehouse=warehouse,
                    scheme=rnd.choice(["FBO", "FBS"]),
                    qty=qty,
                    taken_at=now,
                )
            )


def _seed_orders(session, account_id, items, now, rnd, price) -> None:
    for item in items:
        for _ in range(rnd.randint(3, 12)):
            happened = now - timedelta(days=rnd.randint(0, 29), hours=rnd.randint(0, 23))
            is_return = rnd.random() < 0.15
            session.add(
                OrderRow(
                    account_id=account_id,
                    platform=item.platform,
                    platform_item_id=item.id,
                    external_order_id=f"{item.platform.value}-{rnd.randint(10**7, 10**8)}",
                    qty=1,
                    price=price,
                    is_return=is_return,
                    happened_at=happened,
                )
            )


def _seed_codes(session, account_id, items, stock_total, now, rnd, index) -> None:
    gtin = barcode_to_gtin(items[0].barcode)
    scenario = index % 4

    introduced = stock_total
    frozen = 0
    retired = rnd.randint(2, 8)
    reintroduced_after_return = retired

    if scenario == 0:
        introduced = stock_total + rnd.randint(3, 12)
    elif scenario == 1:
        introduced = max(stock_total - rnd.randint(4, 15), 0)
    elif scenario == 2:
        frozen = rnd.randint(50, 400)
    else:
        reintroduced_after_return = 0

    counter = 0

    def add_code(status: CisStatus, changed_at: datetime) -> None:
        nonlocal counter
        counter += 1
        session.add(
            Cis(
                account_id=account_id,
                cis=f"0{gtin}21{index:03d}{counter:05d}",
                gtin=gtin,
                status=status,
                status_changed_at=changed_at,
            )
        )

    for _ in range(introduced - reintroduced_after_return if scenario == 3 else introduced):
        add_code(CisStatus.introduced, now - timedelta(days=rnd.randint(31, 90)))

    for _ in range(frozen):
        add_code(rnd.choice([CisStatus.emitted, CisStatus.applied]), now - timedelta(days=rnd.randint(5, 60)))

    for _ in range(retired):
        add_code(CisStatus.retired, now - timedelta(days=rnd.randint(1, 25)))

    for _ in range(reintroduced_after_return if scenario == 3 else 0):
        add_code(CisStatus.introduced, now - timedelta(days=rnd.randint(1, 20)))


def _seed_credentials(session: Session, account_id: int) -> None:
    from .crypto import encrypt, hint
    from .models import CredentialKind

    demo_keys = [
        (CredentialKind.wb, "WB · основной токен", "eyJhbGciOiJFUzI1NiIsImtpZCI6IkRFTU8ifQ.demo-wb-token", 180),
        (CredentialKind.ozon, "Ozon · Seller API", "d1f4c0de-0000-4a1b-9c2d-demoozonkey", 90),
        (CredentialKind.gismt, "ГИС МТ · песочница", "demo-gismt-sandbox-token", 1),
    ]
    today = datetime.utcnow().date()
    for kind, label, secret, days in demo_keys:
        session.add(
            Credential(
                account_id=account_id,
                kind=kind,
                label=label,
                secret_encrypted=encrypt(secret),
                hint=hint(secret),
                expires_at=today + timedelta(days=days),
                last_check_at=datetime.utcnow(),
                last_check_ok=True,
                last_check_message="Демо-режим: ключ принят без обращения к внешнему API",
            )
        )
