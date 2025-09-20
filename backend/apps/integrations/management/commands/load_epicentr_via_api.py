import json
import requests
from django.core.management.base import BaseCommand
from apps.integrations.models.models_epicentr import (
    EpicentrCategories,
    EpicentrAttributeSet,
    EpicentrAttribute,
    EpicentrAttributeGroup,
    EpicentrAttributeOption,
)


SELECTED_CATEGORIES_JSON = """
[
    {
        "code": "5354",
        "parentCode": "7567",
        "hasChild": true,
        "attributeSets": [
            {
                "code": "5354"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Одежда"
            },
            {
                "languageCode": "ua",
                "title": "Одяг"
            }
        ],
        "deleted": false
    },
    {
        "code": "1784",
        "parentCode": "7147",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "1784"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Джинсы женские"
            },
            {
                "languageCode": "ua",
                "title": "Джинси жіночі"
            }
        ],
        "deleted": true
    },
    {
        "code": "5426",
        "parentCode": "5355",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5426"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Блузки"
            },
            {
                "languageCode": "ru",
                "title": "Блузки"
            }
        ],
        "deleted": false
    },
    {
        "code": "5432",
        "parentCode": "5358",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5432"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Жіночі сумки"
            },
            {
                "languageCode": "ru",
                "title": "Женские сумки"
            }
        ],
        "deleted": false
    },
    {
        "code": "5445",
        "parentCode": "5355",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5445"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Домашняя одежда женская"
            },
            {
                "languageCode": "ua",
                "title": "Домашній одяг жіночий"
            }
        ],
        "deleted": true
    },
    {
        "code": "5441",
        "parentCode": "7162",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5441"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Свитеры женские"
            },
            {
                "languageCode": "ua",
                "title": "Светри жіночі"
            }
        ],
        "deleted": true
    },
    {
        "code": "6390",
        "parentCode": "5354",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "6390"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Платья"
            },
            {
                "languageCode": "ua",
                "title": "Сукні"
            }
        ],
        "deleted": false
    },
    {
        "code": "5414",
        "parentCode": "5355",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5414"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Юбки"
            },
            {
                "languageCode": "ua",
                "title": "Спідниці"
            }
        ],
        "deleted": false
    },
    {
        "code": "1784",
        "parentCode": "7147",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "1784"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Джинсы женские"
            },
            {
                "languageCode": "ua",
                "title": "Джинси жіночі"
            }
        ],
        "deleted": true
    },
    {
        "code": "1363",
        "parentCode": "1595",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "1363"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Футболки та майки"
            },
            {
                "languageCode": "ru",
                "title": "Футболки и майки"
            }
        ],
        "deleted": true
    },
    {
        "code": "5390",
        "parentCode": "5356",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5390"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Ремни и пояса"
            },
            {
                "languageCode": "ua",
                "title": "Ремені та пояси"
            }
        ],
        "deleted": false
    },
    {
        "code": "9142",
        "parentCode": "5354",
        "hasChild": true,
        "attributeSets": [
            {
                "code": "9142"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Костюмы"
            },
            {
                "languageCode": "ua",
                "title": "Костюми"
            }
        ],
        "deleted": false
    },
    {
        "code": "7163",
        "parentCode": "1795",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "7163"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Пуховики"
            },
            {
                "languageCode": "ua",
                "title": "Пуховики"
            }
        ],
        "deleted": true
    },
    {
        "code": "6575",
        "parentCode": "1795",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "6575"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Куртки"
            },
            {
                "languageCode": "ua",
                "title": "Куртки"
            }
        ],
        "deleted": false
    },
    {
        "code": "7925",
        "parentCode": "1795",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "7925"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Шубы"
            },
            {
                "languageCode": "ua",
                "title": "Шуби"
            }
        ],
        "deleted": false
    },
    {
        "code": "5430",
        "parentCode": "5355",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5430"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Туніки"
            },
            {
                "languageCode": "ru",
                "title": "Туники"
            }
        ],
        "deleted": false
    },
    {
        "code": "1790",
        "parentCode": "6850",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "1790"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Брюки"
            },
            {
                "languageCode": "ru",
                "title": "Брюки"
            }
        ],
        "deleted": false
    },
    {
        "code": "6568",
        "parentCode": "5399",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "6568"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Кепки"
            },
            {
                "languageCode": "ua",
                "title": "Кепки"
            }
        ],
        "deleted": false
    },
    {
        "code": "5394",
        "parentCode": "7571",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5394"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Сапоги"
            },
            {
                "languageCode": "ua",
                "title": "Чоботи"
            }
        ],
        "deleted": false
    },
    {
        "code": "5389",
        "parentCode": "7571",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "5389"
            }
        ],
        "translations": [
            {
                "languageCode": "ru",
                "title": "Босоножки"
            },
            {
                "languageCode": "ua",
                "title": "Босоніжки"
            }
        ],
        "deleted": false
    },
    {
        "code": "6466",
        "parentCode": "7571",
        "hasChild": false,
        "attributeSets": [
            {
                "code": "6466"
            }
        ],
        "translations": [
            {
                "languageCode": "ua",
                "title": "Туфлі"
            },
            {
                "languageCode": "ru",
                "title": "Туфли"
            }
        ],
        "deleted": false
    }
]
"""


class Command(BaseCommand):
    help = "Load Epicentr categories and attributes via API"

    def add_arguments(self, parser):
        parser.add_argument(
            "--only-attributes",
            action="store_true",
            help="Грузить только наборы и атрибуты без опций",
        )
        parser.add_argument(
            "--only-options",
            action="store_true",
            help="Догрузить только опции для select/multiselect атрибутов",
        )

    def handle(self, *args, **options):
        selected_categories = json.loads(SELECTED_CATEGORIES_JSON)
        active_categories = [c for c in selected_categories if not c.get("deleted", False)]
        selected_codes = {str(c.get("code")) for c in active_categories}
        only_attributes = bool(options.get("only_attributes"))
        only_options = bool(options.get("only_options"))
        for c in active_categories:
            translations = c.get("translations", [])
            name = None
            for t in translations:
                if t.get("languageCode") == "ru":
                    name = t.get("title")
                    break
            if not name and translations:
                name = translations[0].get("title")
            if not name:
                name = str(c.get("code"))
            attribute_sets_value = [{"code": str(c.get("code"))}]
            obj, created = EpicentrCategories.objects.get_or_create(
                code=str(c.get("code")),
                defaults={
                    "name": name,
                    "attribute_sets": attribute_sets_value,
                },
            )
            if not created:
                obj.name = name
                obj.attribute_sets = attribute_sets_value
                obj.save()
        if only_options:
            self.load_options(selected_codes)
            return

        base_url = "https://api.epicentrm.com.ua/v2/pim/attribute-sets"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
            "Authorization": "Bearer 5a6489d1a5c48c9d174bd31f2a0a8fd0",
        }
        page = 1
        while True:
            url = f"{base_url}?page={page}"
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("data")
            if items is None:
                items = data.get("items")
            if items is None:
                items = []
            if not items:
                break
            for item in items:
                attributes = item.get("attributes")
                if not isinstance(attributes, list):
                    continue
                code = str(item.get("code"))
                attr_set_id = item.get("id")
                if code not in selected_codes:
                    continue
                tr = item.get("translations", [])
                set_name = None
                for t in tr:
                    if t.get("languageCode") == "ru":
                        set_name = t.get("title")
                        break
                if not set_name and tr:
                    set_name = tr[0].get("title")
                if not set_name:
                    set_name = code
                attr_set, created = EpicentrAttributeSet.objects.get_or_create(
                    code=code,
                    defaults={"name": set_name},
                )
                if not created:
                    attr_set.name = set_name
                    attr_set.save()
                EpicentrAttribute.objects.filter(attribute_set=attr_set).delete()
                EpicentrAttributeGroup.objects.filter(attribute_set=attr_set).delete()
                for ad in attributes:
                    attr_code = str(ad.get("code"))
                    attribute_id = ad.get("id")
                    attr_type = ad.get("type")
                    is_system = bool(ad.get("isSystem"))
                    is_required = bool(ad.get("isRequired"))
                    atr_tr = ad.get("translations", [])
                    attr_name = None
                    for t in atr_tr:
                        if t.get("languageCode") == "ru":
                            attr_name = t.get("title")
                            break
                    if not attr_name and atr_tr:
                        attr_name = atr_tr[0].get("title")
                    if not attr_name:
                        attr_name = attr_code

                    group = None
                    if attr_type in ("select", "multiselect"):
                        group, _ = EpicentrAttributeGroup.objects.get_or_create(
                            attribute_set=attr_set,
                            code=attr_code,
                            defaults={"name": attr_name},
                        )
                    attribute = EpicentrAttribute.objects.create(
                        attribute_set=attr_set,
                        attribute_group=group,
                        name=attr_name,
                        code=attr_code,
                        type=attr_type,
                        is_system=is_system,
                        is_required=is_required,
                    )
                    if not only_attributes and attr_type in ("select", "multiselect"):
                        self.fetch_and_store_options(headers, code, attr_code, attribute)
            page += 1

    def load_options(self, selected_codes):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
            "Authorization": "Bearer 5a6489d1a5c48c9d174bd31f2a0a8fd0",
        }
        attrs = EpicentrAttribute.objects.filter(
            attribute_set__code__in=selected_codes,
            type__in=("select", "multiselect"),
        ).select_related("attribute_set")
        for attribute in attrs:
            EpicentrAttributeOption.objects.filter(attribute=attribute).delete()
            self.fetch_and_store_options(headers, attribute.attribute_set.code, attribute.code, attribute)

    def fetch_and_store_options(self, headers, attribute_set_code, attribute_code, attribute):
        options_page = 1
        while True:
            options_url = f"https://api.epicentrm.com.ua/v2/pim/attribute-sets/{attribute_set_code}/attributes/{attribute_code}/options?page={options_page}"
            opt_resp = requests.get(options_url, headers=headers, timeout=30)
            opt_resp.raise_for_status()
            opt_data = opt_resp.json()
            opt_items = opt_data.get("data")
            if opt_items is None:
                opt_items = opt_data.get("items")
            if opt_items is None:
                opt_items = []
            if not opt_items:
                break
            for oi in opt_items:
                option_code = str(oi.get("code"))
                o_tr = oi.get("translations", [])
                option_name = None
                for ot in o_tr:
                    if ot.get("languageCode") == "ru":
                        option_name = ot.get("title")
                        break
                if not option_name and o_tr:
                    option_name = o_tr[0].get("title")
                if not option_name:
                    option_name = option_code
                EpicentrAttributeOption.objects.create(
                    attribute=attribute,
                    code=option_code,
                    name=option_name,
                )
            options_page += 1

