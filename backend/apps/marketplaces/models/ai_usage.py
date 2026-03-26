from django.db import models


class AIUsageLog(models.Model):
    """Лог использования AI API с подсчётом стоимости"""

    PRICING = {
        'claude-haiku-4-5-20251001': {'input': 1.0, 'output': 5.0},
        'claude-sonnet-4-20250514': {'input': 3.0, 'output': 15.0},
    }

    model = models.CharField(max_length=100)
    action = models.CharField(max_length=100)  # e.g. 'fill_marketplace', 'fill_base', 'assign_levels'
    product = models.ForeignKey(
        'product.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ai_usage_logs',
    )
    marketplace = models.ForeignKey(
        'marketplaces.Marketplace', on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    cost_usd = models.FloatField(default=0)  # in USD
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Usage Log'
        verbose_name_plural = 'AI Usage Logs'
        ordering = ['-created_at']

    @classmethod
    def log(cls, response, model_name, action, product=None, marketplace=None):
        """Log an Anthropic API response"""
        usage = getattr(response, 'usage', None)
        if not usage:
            return None

        input_tokens = getattr(usage, 'input_tokens', 0)
        output_tokens = getattr(usage, 'output_tokens', 0)

        pricing = cls.PRICING.get(model_name, {'input': 3.0, 'output': 15.0})
        cost = (input_tokens * pricing['input'] + output_tokens * pricing['output']) / 1_000_000

        return cls.objects.create(
            model=model_name,
            action=action,
            product=product,
            marketplace=marketplace,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=round(cost, 6),
        )

    @classmethod
    def total_cost(cls):
        from django.db.models import Sum
        result = cls.objects.aggregate(total=Sum('cost_usd'))
        return result['total'] or 0
