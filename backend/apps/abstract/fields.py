import os
import uuid
from functools import reduce

from django import forms
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.forms.widgets import FileInput
from django.core.validators import FileExtensionValidator
from project.settings import MEDIA_ROOT


class DeletableMediaField(models.FileField):
    valid_extensions = []

    def __init__(self, *args, **kwargs):
        self.get_parent = kwargs.pop('get_parent', None)
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        file_instance = getattr(model_instance, self.name)
        if not file_instance:
            old_file = getattr(model_instance.__class__.objects.get(pk=model_instance.pk), self.name, None)
            try:
                default_storage.delete(old_file.name)
            except:
                pass
            self._prune_empty_app_directories(model_instance)
            return None
        if file_instance:
            self._validate_file_extension(file_instance)
        if not add:
            self._handle_file_replacement(model_instance)
        return super().pre_save(model_instance, add)

    def delete(self, instance, using=None, keep_parents=False):
        self._delete_associated_file(instance)
        self._prune_empty_app_directories(instance)

    def _validate_file_extension(self, file_instance):
        ext = os.path.splitext(file_instance.name)[1].lower()
        if ext not in self.valid_extensions:
            raise ValidationError(f"Invalid file extension. Allowed extensions are: {', '.join(self.valid_extensions)}")

    def _handle_file_replacement(self, model_instance):
        old_file = getattr(model_instance.__class__.objects.get(pk=model_instance.pk), self.name, None)
        new_file = getattr(model_instance, self.name, None)
        if old_file and new_file and old_file != new_file:
            default_storage.delete(old_file.name)

    def _delete_associated_file(self, instance):
        file_to_delete = getattr(instance, self.name, None)
        if file_to_delete:
            default_storage.delete(file_to_delete.name)

    def _prune_empty_app_directories(self, instance):
        app_media_path = os.path.join(MEDIA_ROOT, instance.__class__._meta.app_label)
        if os.path.exists(app_media_path):
            for root, dirs, files in os.walk(app_media_path, topdown=False):
                if not dirs and not files:
                    os.rmdir(root)

    def generate_filename(self, instance, filename):
        path_parts = self._determine_path_parts(instance, filename)
        return os.path.join(*path_parts)

    def _determine_path_parts(self, instance, filename):
        parent_obj = self._fetch_parent(instance)
        parts = [
            instance.__class__._meta.app_label,
            instance.__class__.__name__.lower() if parent_obj else "",
            str(parent_obj.pk) if parent_obj else "",
            self._construct_new_filename(instance, filename)
        ]
        return [part for part in parts if part]

    def _fetch_parent(self, instance):
        if self.get_parent:
            return reduce(getattr, [instance] + self.get_parent.split('.'))
        return next(
            (getattr(instance, field.name) for field in instance._meta.fields if isinstance(field, models.ForeignKey)),
            None)

    def _construct_new_filename(self, instance, filename):
        if hasattr(instance, 'slug') and instance.slug:
            return f"{instance.slug}{os.path.splitext(filename)[1]}"
        return f"{uuid.uuid4().hex}{os.path.splitext(filename)[1]}"


class CustomFileInput(forms.fields.FileField):
    default_validators = []
    default_accept = ""

    def widget_attrs(self, widget):
        attrs = super().widget_attrs(widget)
        if isinstance(widget, FileInput) and "accept" not in widget.attrs:
            attrs.setdefault("accept", self.default_accept)
        return attrs


class CustomImageInput(CustomFileInput):
    default_validators = [FileExtensionValidator(allowed_extensions=['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff'])]
    default_accept = "image/*"


class CustomVideoInput(CustomFileInput):
    default_validators = [FileExtensionValidator(allowed_extensions=['mp4', 'mkv', 'flv', 'avi', 'mov', 'wmv'])]
    default_accept = "video/*"


class DeletableImageField(DeletableMediaField):
    valid_extensions = ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.tiff']

    def formfield(self, **kwargs):
        return super().formfield(form_class=CustomImageInput, **kwargs)


class DeletableVideoField(DeletableMediaField):
    valid_extensions = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv']

    def __init_subclass__(cls, **kwargs):
        print(cls)
        super().__init_subclass__(**kwargs)

    def formfield(self, **kwargs):
        return super().formfield(form_class=CustomVideoInput, **kwargs)


@receiver(pre_delete)
def delete_file_on_delete(sender, instance, **kwargs):
    for field in instance._meta.fields:
        if isinstance(field, DeletableImageField) or isinstance(field, DeletableVideoField):
            field.delete(instance)
            file_field = getattr(instance, field.name)

            if file_field:
                file_field.delete(False)
