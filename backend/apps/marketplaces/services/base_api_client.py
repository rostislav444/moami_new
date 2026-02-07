from abc import ABC, abstractmethod
from typing import Iterator, Dict, Any, Optional, List
import requests
import logging

logger = logging.getLogger(__name__)


class BaseMarketplaceClient(ABC):
    """Базовый клиент для работы с API маркетплейсов"""

    def __init__(self, marketplace):
        """
        Args:
            marketplace: объект Marketplace из БД
        """
        from apps.marketplaces.models import Marketplace

        self.marketplace: Marketplace = marketplace
        self.config = marketplace.api_config or {}
        self.base_url = self.config.get('base_url', '')
        self.session = requests.Session()
        self._setup_auth()
        self._setup_headers()

    def _setup_auth(self):
        """Настройка авторизации"""
        auth_type = self.config.get('auth_type')

        if auth_type == 'bearer':
            token = self.config.get('token')
            if token:
                self.session.headers['Authorization'] = f'Bearer {token}'
        elif auth_type == 'api_key':
            api_key = self.config.get('api_key')
            if api_key:
                self.session.headers['X-API-Key'] = api_key

    def _setup_headers(self):
        """Настройка заголовков"""
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        })

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Выполнить HTTP запрос

        Args:
            method: HTTP метод (GET, POST, etc.)
            endpoint: путь эндпоинта
            params: query параметры
            data: данные для POST/PUT
            timeout: таймаут в секундах

        Returns:
            JSON ответ
        """
        url = f'{self.base_url}{endpoint}'

        try:
            response = self.session.request(
                method,
                url,
                params=params,
                json=data,
                timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'API request failed: {method} {url} - {e}')
            raise

    def _paginate(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        data_key: str = 'data',
        page_param: str = 'page'
    ) -> Iterator[Dict]:
        """
        Пагинация для эндпоинтов с постраничной выдачей

        Args:
            endpoint: путь эндпоинта
            params: дополнительные параметры
            data_key: ключ для получения данных из ответа
            page_param: название параметра страницы

        Yields:
            Элементы из каждой страницы
        """
        page = 1
        params = params or {}

        while True:
            params[page_param] = page
            response = self._request('GET', endpoint, params=params)

            items = response.get(data_key) or response.get('items') or []

            if not items:
                break

            yield from items

            # Проверяем, есть ли еще страницы
            total_pages = response.get('pages', 1)
            if page >= total_pages:
                break

            page += 1

    def _get_translation(
        self,
        translations: List[Dict],
        lang: str = 'ru',
        field: str = 'title'
    ) -> str:
        """
        Получить перевод из списка переводов

        Args:
            translations: список объектов с переводами
            lang: код языка (ru, ua)
            field: название поля с текстом

        Returns:
            Текст перевода или пустая строка
        """
        for t in translations:
            lang_code = t.get('languageCode') or t.get('lang')
            if lang_code == lang:
                return t.get(field) or t.get('value') or ''

        # Fallback на первый доступный перевод
        if translations:
            return translations[0].get(field) or translations[0].get('value') or ''

        return ''

    @abstractmethod
    def sync_categories(self) -> int:
        """
        Синхронизация категорий из API маркетплейса

        Returns:
            Количество синхронизированных категорий
        """
        pass

    @abstractmethod
    def sync_attribute_sets(self, category_codes: Optional[List[str]] = None) -> int:
        """
        Синхронизация наборов атрибутов

        Args:
            category_codes: опциональный список кодов категорий для синхронизации

        Returns:
            Количество синхронизированных наборов
        """
        pass

    @abstractmethod
    def sync_attribute_options(
        self,
        attribute_set_code: str,
        attribute_code: str
    ) -> int:
        """
        Синхронизация опций атрибута

        Args:
            attribute_set_code: код набора атрибутов
            attribute_code: код атрибута

        Returns:
            Количество синхронизированных опций
        """
        pass

    def sync_all_options_for_set(self, attribute_set_code: str) -> int:
        """
        Синхронизация всех опций для набора атрибутов

        Args:
            attribute_set_code: код набора атрибутов

        Returns:
            Общее количество синхронизированных опций
        """
        from apps.marketplaces.models import MarketplaceAttribute

        total = 0
        attrs = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=self.marketplace,
            attribute_set__external_code=attribute_set_code,
            attr_type__in=['select', 'multiselect']
        )

        for attr in attrs:
            count = self.sync_attribute_options(attribute_set_code, attr.external_code)
            total += count
            logger.info(f'Synced {count} options for attribute {attr.name}')

        return total
