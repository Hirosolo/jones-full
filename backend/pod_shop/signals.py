# path: pod_shop/signals.py

from datetime import date, timedelta

from django.core.cache import cache
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver

from pod_shop.models import Product, Review, Order, ProductAttrItem, ProductImage, ProductVariant, ProductColorImage
from utils.common import get_random_code2
from utils.content_processors import clean_content

# Dict ánh xạ các model với các trường tương ứng
PRE_SAVE_MODELS = {
    Review: ['content']
}


@receiver(pre_save)
def handle_pre_save(sender, instance, **kwargs):
    """
    Xử lý trước khi lưu dữ liệu
    """
    if sender in PRE_SAVE_MODELS:
        for field in PRE_SAVE_MODELS[sender]:
            safe_field = f"{field}_safe"
            setattr(instance, safe_field, clean_content(getattr(instance, field)))


# Danh sách các model cần xử lý sau khi lưu
POST_SAVE_MODELS = [Product]


def _invalidate_product_listing_cache() -> None:
    """Clear cached product blocks shown on home/listing pages."""
    cache.delete('featured_products_api')
    cache.delete('bestseller_products_api_v2')
    cache.delete('latest_products_api_v2')

    # Weekly bestseller keys are date-scoped, so clear likely active windows.
    for day in (date.today(), date.today() - timedelta(days=7)):
        iso_year, iso_week, _ = day.isocalendar()
        cache.delete(f'weekly_bestsellers_api:y{iso_year}:w{iso_week}')


@receiver(post_save)
def handle_post_save(sender, instance, created, **kwargs):
    """
    Xử lý sau khi lưu dữ liệu
    """
    if sender in POST_SAVE_MODELS and not instance.code:
        code = get_random_code2(8, "n")
        instance.code = code
        sender.objects.filter(id=instance.id).update(code=code)


@receiver(post_save, sender=Product)
@receiver(post_save, sender=ProductImage)
@receiver(post_save, sender=ProductVariant)
@receiver(post_save, sender=ProductAttrItem)
@receiver(post_save, sender=ProductColorImage)
def invalidate_listing_cache_on_save(sender, instance, **kwargs):
    _invalidate_product_listing_cache()


@receiver(post_delete, sender=Product)
@receiver(post_delete, sender=ProductImage)
@receiver(post_delete, sender=ProductVariant)
@receiver(post_delete, sender=ProductAttrItem)
@receiver(post_delete, sender=ProductColorImage)
def invalidate_listing_cache_on_delete(sender, instance, **kwargs):
    _invalidate_product_listing_cache()


# Xử lý để tạo mã order riêng cho các đơn hàng mới
@receiver(post_save, sender=Order)
def create_order_code(sender, instance, created, **kwargs):
    """
    Tạo mã đơn hàng cho Order nếu là đơn hàng mới.
    Mã đơn hàng sẽ có định dạng 'ORDER' + mã ngẫu nhiên 8 ký tự.
    """
    if created and not instance.code:
        instance.code = f'ORDER{get_random_code2(8, "n")}'
        instance.save()


@receiver(pre_save, sender=ProductAttrItem)
def handle_productattritem_pre_save(sender, instance: ProductAttrItem, **kwargs):
    """
    Xử lý trước khi lưu dữ liệu cho ProductAttrItem.
    """
    if not instance.product:
        instance.product = instance.attr.product
