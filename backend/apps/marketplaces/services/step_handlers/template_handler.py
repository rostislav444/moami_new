import logging
from .base import BaseStepHandler

logger = logging.getLogger(__name__)


class CreateTemplateHandler(BaseStepHandler):
    """Pipeline step: create or update a FeedTemplate"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('template_type'):
            errors.append('template_type is required (header/product/variant/footer)')
        return errors

    def execute(self, config: dict) -> dict:
        from apps.marketplaces.models import FeedTemplate

        config = self.resolve_config(config)

        template_type = config['template_type']
        content = config.get('content', '') or ''
        name = config.get('name', f'{self.marketplace.name} - {template_type}')

        obj, created = FeedTemplate.objects.update_or_create(
            marketplace=self.marketplace,
            template_type=template_type,
            defaults={
                'name': name,
                'content': content,
                'is_active': True,
            },
        )

        action = 'Created' if created else 'Updated'
        self.log_info(f'{action} template {template_type} for {self.marketplace.name}')

        return {
            'template_id': obj.id,
            'template_type': template_type,
            'action': action.lower(),
        }
