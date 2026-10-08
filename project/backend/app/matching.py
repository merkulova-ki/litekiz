from sqlmodel import Session, select

from .models import PlatformItem, Product


def barcode_to_gtin(barcode: str) -> str:
    digits = "".join(ch for ch in barcode if ch.isdigit())
    return digits.rjust(14, "0")[-14:]


def auto_match(session: Session, account_id: int) -> dict:
    items = session.exec(
        select(PlatformItem).where(
            PlatformItem.account_id == account_id,
            PlatformItem.product_id.is_(None),
        )
    ).all()

    stats = {"by_barcode": 0, "by_offer_code": 0, "created": 0, "left_unmatched": 0}

    for key_name, key_func in (("by_barcode", lambda i: i.barcode), ("by_offer_code", lambda i: i.offer_code)):
        groups: dict[str, list[PlatformItem]] = {}
        for item in items:
            if item.product_id is not None:
                continue
            key = (key_func(item) or "").strip().lower()
            if key:
                groups.setdefault(key, []).append(item)

        for key, group in groups.items():
            product = _find_existing_product(session, account_id, key, key_name)

            platforms = {i.platform for i in group}
            if product is None and len(platforms) < 2:
                continue

            if product is None:
                sample = group[0]
                product = Product(
                    account_id=account_id,
                    gtin=barcode_to_gtin(sample.barcode),
                    name=sample.name,
                    cost_price=round(sample.price * 0.55, 2),
                )
                session.add(product)
                session.flush()
                stats["created"] += 1

            for item in group:
                item.product_id = product.id
                item.match_source = "barcode" if key_name == "by_barcode" else "offer_code"
                session.add(item)
                stats[key_name] += 1

    session.commit()

    stats["left_unmatched"] = len(
        session.exec(
            select(PlatformItem).where(
                PlatformItem.account_id == account_id,
                PlatformItem.product_id.is_(None),
            )
        ).all()
    )
    return stats


def _find_existing_product(session: Session, account_id: int, key: str, key_name: str) -> Product | None:
    field = PlatformItem.barcode if key_name == "by_barcode" else PlatformItem.offer_code
    matched = session.exec(
        select(PlatformItem).where(
            PlatformItem.account_id == account_id,
            PlatformItem.product_id.is_not(None),
            field == key,
        )
    ).first()
    if matched is None:
        return None
    return session.get(Product, matched.product_id)


def link_manually(session: Session, item_id: int, product_id: int | None) -> PlatformItem:
    item = session.get(PlatformItem, item_id)
    if item is None:
        raise ValueError("Карточка не найдена")
    if product_id is not None and session.get(Product, product_id) is None:
        raise ValueError("Товар не найден")
    item.product_id = product_id
    item.match_source = "manual" if product_id else ""
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def create_product_from_item(session: Session, item_id: int) -> Product:
    item = session.get(PlatformItem, item_id)
    if item is None:
        raise ValueError("Карточка не найдена")
    product = Product(
        account_id=item.account_id,
        gtin=barcode_to_gtin(item.barcode),
        name=item.name,
        cost_price=round(item.price * 0.55, 2),
    )
    session.add(product)
    session.flush()
    item.product_id = product.id
    item.match_source = "manual"
    session.add(item)
    session.commit()
    session.refresh(product)
    return product
