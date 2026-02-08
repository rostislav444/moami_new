from django.db import models


class AgentConversation(models.Model):
    """Сессия разговора с AI Research Agent"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('waiting_input', 'Waiting for User Input'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]

    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    context = models.JSONField(
        default=dict,
        help_text='Research findings: URLs, API structure, file formats, etc.'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agent Conversation'
        verbose_name_plural = 'Agent Conversations'

    def __str__(self):
        return f"Conversation #{self.id} for {self.marketplace.name}"

    def add_message(self, role, content, message_type='text', metadata=None):
        """Добавить сообщение в разговор"""
        return AgentMessage.objects.create(
            conversation=self,
            role=role,
            content=content,
            message_type=message_type,
            metadata=metadata or {}
        )

    def get_messages_since(self, timestamp):
        """Получить сообщения после указанного времени"""
        return self.messages.filter(created_at__gt=timestamp)


class AgentMessage(models.Model):
    """Сообщение в разговоре с AI агентом"""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('question', 'Question requiring answer'),
        ('findings', 'Research findings'),
        ('progress', 'Progress update'),
        ('error', 'Error'),
        ('action', 'Action performed'),
    ]

    conversation = models.ForeignKey(
        AgentConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default='text'
    )
    content = models.TextField()
    metadata = models.JSONField(
        default=dict,
        help_text='URLs, options for user, structured data, etc.'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Agent Message'
        verbose_name_plural = 'Agent Messages'

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
