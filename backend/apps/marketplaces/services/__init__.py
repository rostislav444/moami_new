from .base_api_client import MarketplaceClient


def get_marketplace_client(marketplace) -> MarketplaceClient:
    """Get API client for a marketplace, configured from its api_config"""
    return MarketplaceClient(marketplace)


__all__ = [
    'MarketplaceClient',
    'get_marketplace_client',
]
