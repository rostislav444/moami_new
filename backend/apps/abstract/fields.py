import os
import uuid

from django.core.files.storage import default_storage
from django.db import models

from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver
from project.settings import MEDIA_ROOT


class DeletableImageField(models.ImageField):
    def __init__(self, *args, **kwargs):
        self.get_parent = kwargs.pop('get_parent', None)
        self.autodetect_app_name = kwargs.pop('autodetect_app_name', True)
        super().__init__(*args, **kwargs)

    def generate_filename(self, instance, filename):
        name_parts = []

        parent_obj = None
        if self.get_parent:
            for obj in self.get_parent.split('.'):
                parent_obj = getattr(parent_obj or instance, obj)
        else:
            for field in instance._meta.fields:
                if isinstance(field, models.ForeignKey):
                    parent_obj = getattr(instance, field.name)
                    break

        # Get app name
        if self.autodetect_app_name:
            name_parts.append(instance.__class__._meta.app_label)

        # Get model name
        if parent_obj:
            name_parts.append(instance.__class__.__name__.lower())
            name_parts.append(str(parent_obj.pk))

        # Get file name
        if hasattr(instance, 'slug') and getattr(instance, 'slug'):
            name, ext = os.path.splitext(filename)
            filename = f"{instance.slug}{ext}"
        else:
            filename = f"{uuid.uuid4().hex}{os.path.splitext(filename)[1]}"
        name_parts.append(filename)
        name_parts = [str(part) for part in name_parts]
        return os.path.join(*name_parts)

    def delete(self, instance, using=None, keep_parents=False):
        print('delete')
        # Delete the file from the storage
        if hasattr(instance, self.name):
            file = getattr(instance, self.name)
            if file:
                default_storage.delete(file.name)

        if self.autodetect_app_name:
            app_name = instance.__class__._meta.app_label
            madia_path = os.path.join(MEDIA_ROOT, app_name)
            if os.path.exists(madia_path):
                for root, dirs, files in os.walk(madia_path, topdown=False):
                    print(dirs, files)
                    if not dirs and not files:
                        os.rmdir(root)

        super().delete(instance, using=using, keep_parents=keep_parents)

    def pre_save(self, model_instance, add):
        # Delete old file if a new file is replacing it
        if not add:
            try:
                old_file = getattr(model_instance.__class__.objects.get(pk=model_instance.pk), self.name)
                new_file = getattr(model_instance, self.name)
                if old_file and old_file != new_file:
                    default_storage.delete(old_file.name)
            except model_instance.__class__.DoesNotExist:
                pass

        return super().pre_save(model_instance, add)


@receiver(pre_delete)
def delete_file_on_delete(sender, instance, **kwargs):
    """
    Delete the file associated with the instance of any model with a FileField being deleted.
    """
    # Iterate over all the fields on the instance
    for field in instance._meta.fields:
        if isinstance(field, DeletableImageField):
            # Get the value of the FileField attribute
            file_field = getattr(instance, field.name)
            print(file_field)
            if file_field:
                # Delete the file if it exists
                file_field.delete(False)
