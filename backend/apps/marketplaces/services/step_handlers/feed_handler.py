import os
import logging
from django.conf import settings
from django.utils import timezone

from .base import BaseStepHandler

logger = logging.getLogger(__name__)


class GenerateFeedHandler(BaseStepHandler):
    """Pipeline step: generate XML feed for marketplace"""

    def validate_config(self, config: dict) -> list[str]:
        return []

    def execute(self, config: dict) -> dict:
        from apps.marketplaces.services.feed_generator import FeedGenerator

        generator = FeedGenerator(self.marketplace)
        result = generator.generate()

        # Save to file
        feed_dir = os.path.join(settings.MEDIA_ROOT, 'mp_feed')
        os.makedirs(feed_dir, exist_ok=True)
        filename = config.get('filename') or self.marketplace.feed_filename or f'{self.marketplace.slug}.xml'
        filepath = os.path.join(feed_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(result['xml'])

        file_size = os.path.getsize(filepath)

        # Update marketplace
        self.marketplace.last_feed_generated = timezone.now()
        self.marketplace.save(update_fields=['last_feed_generated'])

        return {
            'products_count': result['products_count'],
            'generation_time': result['generation_time'],
            'file_path': f'/media/mp_feed/{filename}',
            'file_size': file_size,
        }
