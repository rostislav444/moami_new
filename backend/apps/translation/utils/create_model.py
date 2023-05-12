from django.db import models
from project import settings
import sys


def create_translation_model(model):
    class TranslatableModel(models.Model):
        class Meta:
            abstract = True

        def __str__(self):
            return self.language_code

        def save(self):
            super(TranslatableModel, self).save()

    def create_model(model_name, fields, module_name):
        module = sys.modules[module_name]

        fields['__module__'] = module.__name__
        new_model = type(model_name, (TranslatableModel,), fields)

        setattr(module, model_name, new_model)
        return new_model


    # def create_model(model_name, fields, module_name):
    #     module = sys.modules[module_name]
    #
    #     def __str__(self):
    #         return self.language_code
    #
    #     base_model = models.Model
    #
    #     fields['__module__'] = module.__name__
    #     new_model = type(model_name, (base_model,), fields)
    #     new_model.__str__ = __str__
    #     setattr(module, model_name, new_model)
    #     return new_model

    def get_translatable_fields(model):
        new_fields = {}
        for field in model._meta.get_fields():
            if isinstance(field, models.CharField) or isinstance(field, models.TextField):
                # TODO Make one method
                if field.name not in ['slug']:
                    new_fields[field.name] = field
                    new_fields[field.name].blank = True
                    new_fields[field.name].null = True
        return new_fields

    model_name = model.__name__
    model_name_translation = f'{model_name}Translation'
    module = model.__module__

    base_fields = {
        'parent': models.ForeignKey(model, on_delete=models.CASCADE, related_name='translations'),
        'language_code': models.CharField(max_length=6, choices=settings.FOREIGN_LANGUAGES),
    }
    translatable_fields = get_translatable_fields(model)
    all_fields = {
        **base_fields,
        **translatable_fields
    }
    new_model = create_model(model_name_translation, all_fields, module)
    new_model._meta.verbose_name = f'{model_name} translation'
    new_model._meta.verbose_name_plural = f'{model_name} translations'
    new_model._meta.unique_together = (('parent', 'language_code',),)
    new_model.translatable_fields = translatable_fields
    return new_model