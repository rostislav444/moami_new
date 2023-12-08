import json

from django.contrib import admin
from django.utils.safestring import mark_safe
from mptt.admin import MPTTModelAdmin
from pygments import highlight
from pygments.formatters.html import HtmlFormatter
from pygments.lexers.data import JsonLexer
from singlemodeladmin import SingleModelAdmin

from apps.integrations.models import ModnaKastaTolen, ModnaKastaLog, ModnaKastaCategories


@admin.register(ModnaKastaTolen)
class ModnaKastaTolenAdmin(SingleModelAdmin):
    pass


def formated_json(obj, field):
    data = json.dumps(getattr(obj, field), indent=2, ensure_ascii=False)

    # format it with pygments and highlight it
    formatter = HtmlFormatter(style='colorful')
    response = highlight(data, JsonLexer(), formatter)

    # include the style sheet
    style = "<style>" + formatter.get_style_defs() + "</style><br/>"

    return mark_safe(style + response)


@admin.register(ModnaKastaLog)
class ModnaKastaLogAdmin(admin.ModelAdmin):
    def payload_json(self, obj):
        return formated_json(obj, 'payload')

    def message_json(self, obj):
        return formated_json(obj, 'message')

    list_display = ['date', 'status', 'url']
    fields = ['status', 'url', 'payload_json', 'message_json']
    readonly_fields = fields


@admin.register(ModnaKastaCategories)
class ModnaKastaCategories(MPTTModelAdmin):
    search_fields = ['name', 'name_alias']


__all__ = [
    'ModnaKastaTolenAdmin',
    'ModnaKastaLogAdmin',
    'ModnaKastaCategories'
]
