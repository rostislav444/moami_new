import json

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from apps.categories.models import Category
from apps.integrations.serializers import ModnaKastaProductSerializer
from apps.integrations.utils.modna_kasta import mk_request
from apps.integrations.utils.modna_kasta import show_hide_sizes, update_stock
from apps.product.models import VariantSize, Variant, VariantMkUpdateStatus


@receiver(pre_save, sender=VariantSize)
def mk_update_size_availablity(sender, instance, **kwargs):
    if instance.pk:
        old = VariantSize.objects.get(pk=instance.pk)
        sku = instance.mk_sku

        if instance.stock == 0:
            show_hide_sizes([sku], False)
        elif old.stock == 0 and instance.stock > 0:
            show_hide_sizes([sku], True)


@receiver(pre_save, sender=VariantSize)
def mk_update_size_stock(sender, instance, **kwargs):
    if instance.pk:
        sku = instance.mk_sku
        update_stock(sku, instance.stock)


# @receiver(pre_save, sender=VariantImage)
# def update_variant_images(sender, instance, **kwargs):
#     if instance.pk:
#         images = instance.variant.images.all()
#         print(images)


@receiver(post_save, sender=Category)
def update_mk_stock(sender, instance, **kwargs):
    url = 'https://hub.modnakasta.ua/api/products/update-stock/id'

    if instance.update_mk_stock:
        sizes = VariantSize.objects.filter(variant__product__category=instance)
        payload = {'items': []}
        for size in sizes:
            payload['items'].append({
                'unique_sku_id': size.mk_sku,
                'stock': size.stock
            })

        mk_request(url, payload)

        Category.objects.filter(pk=instance.pk).update(update_mk_stock=False)


# @receiver(post_save, sender=Variant)
# def load_variant_to_mk(sender, instance, **kwargs):
#     url = 'https://hub.modnakasta.ua/api/supplier-content/submit/products'
#
#     if instance:
#         payload = ModnaKastaProductSerializer(instance).data
#         response = mk_request(url, payload)
#
#         update_status = VariantMkUpdateStatus.objects.filter(variant=instance).first()
#
#         if update_status:
#             update_status.status = response['status_code']
#             update_status.response = response['message']
#         else:
#             update_status = VariantMkUpdateStatus(
#                 variant=instance,
#                 status=response['status_code'],
#                 response=response['message']
#             )
#         update_status.save()


