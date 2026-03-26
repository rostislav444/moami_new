from .base import BaseStepHandler
from .download_handler import DownloadFileHandler
from .parse_handlers import ParseXMLHandler, ParseJSONHandler, ParseCSVHandler
from .parse_xlsx_handler import ParseXLSXHandler
from .sync_handlers import (
    SyncCategoriesHandler,
    SyncAttributesHandler,
    SyncOptionsHandler,
    SyncEntitiesHandler,
)
from .api_handler import APICallHandler
from .feed_handler import GenerateFeedHandler

# Registry of all handlers by step type
STEP_HANDLERS = {
    'download_file': DownloadFileHandler,
    'parse_xml': ParseXMLHandler,
    'parse_json': ParseJSONHandler,
    'parse_csv': ParseCSVHandler,
    'parse_xlsx': ParseXLSXHandler,
    'sync_categories': SyncCategoriesHandler,
    'sync_attributes': SyncAttributesHandler,
    'sync_options': SyncOptionsHandler,
    'sync_entities': SyncEntitiesHandler,
    'api_call': APICallHandler,
    'generate_feed': GenerateFeedHandler,
}


def get_handler(step_type: str, marketplace):
    """Get handler instance for step type"""
    handler_class = STEP_HANDLERS.get(step_type)
    if not handler_class:
        raise ValueError(f"Unknown step type: {step_type}")
    return handler_class(marketplace)


__all__ = [
    'BaseStepHandler',
    'DownloadFileHandler',
    'ParseXMLHandler',
    'ParseJSONHandler',
    'ParseCSVHandler',
    'ParseXLSXHandler',
    'SyncCategoriesHandler',
    'SyncAttributesHandler',
    'SyncOptionsHandler',
    'SyncEntitiesHandler',
    'APICallHandler',
    'GenerateFeedHandler',
    'STEP_HANDLERS',
    'get_handler',
]
