from django import forms
from django.contrib import admin
from django.db import models

from project import settings


def get_admin_module(model):
    app_name = model._meta.app_label
    module = __import__('apps')
    path = app_name + '.admin'
    for directory in path.split('.'):
        module = getattr(module, directory)
    return module


def create_form(translation_model):
    form_name = translation_model.__name__ + 'Form'

    all_fields = ['language_code', ]
    for field in translation_model._meta.get_fields():
        if isinstance(field, models.CharField) or isinstance(field, models.TextField):
            if field.name != 'language_code':
                all_fields.append(field.name)

    class TranslationForm(forms.ModelForm):
        class Meta:
            model = translation_model
            fields = all_fields
            exclude = ('parent',)

    # translation_form = type(form_name, (forms.ModelForm,), {
    #     'Meta': type('Meta', (object,), {
    #         'model': translation_model,
    #         'fields': ('language_code', 'parent', *fields),
    #         'read_only': ('parent',),
    #     })
    # })
    return type(form_name, (TranslationForm,), {})


def create_formset(translation_model):
    formset_name = translation_model.__name__ + 'FormSet'

    class TranslationFormSet(forms.BaseInlineFormSet):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

            for form, attr_group in zip(self.forms, settings.FOREIGN_LANGUAGES):
                form.fields['language_code'].initial = attr_group[0]
                form.fields['language_code'].choices = ((attr_group[0], attr_group[1]),)
                form.fields['language_code'].empty_label = None

        class Meta:
            model = translation_model
            fields = '__all__'
            extra = settings.FOREIGN_LANGUAGES_COUNT
            max_num = settings.FOREIGN_LANGUAGES_COUNT
            min_num = settings.FOREIGN_LANGUAGES_COUNT

        def get_queryset(self):
            return super().get_queryset().filter(parent=self.instance)

    return type(formset_name, (TranslationFormSet,), {})


def create_model_admin(model, translation_model):
    admin_module = get_admin_module(model)
    admin_parent = getattr(admin_module, model.__name__ + 'Admin')

    if admin_parent:
        inline_name = translation_model.__name__ + 'Inline'
        form = create_form(translation_model)
        formset = create_formset(translation_model)

        translation_inline = type(inline_name, (admin.StackedInline,), {
            'model': translation_model,
            'min_num': settings.FOREIGN_LANGUAGES_COUNT,
            'max_num': settings.FOREIGN_LANGUAGES_COUNT,
            '__module__': admin_module.__name__,
            'sortable_options': 'parent',
            'form': form,
            'formset': formset
        })
        setattr(admin_module, inline_name, translation_inline)

        if not len(admin_parent.inlines):
            admin_parent.inlines = ()

        admin_parent.inlines = (*admin_parent.inlines, translation_inline)
