from rest_framework import serializers
from apps.marketplaces.models import AgentConversation, AgentMessage


class AgentMessageSerializer(serializers.ModelSerializer):
    """Serializer for agent messages"""

    class Meta:
        model = AgentMessage
        fields = [
            'id',
            'role',
            'message_type',
            'content',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AgentConversationSerializer(serializers.ModelSerializer):
    """Serializer for agent conversations"""

    messages = AgentMessageSerializer(many=True, read_only=True)
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)

    class Meta:
        model = AgentConversation
        fields = [
            'id',
            'marketplace',
            'marketplace_name',
            'status',
            'context',
            'messages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'context', 'created_at', 'updated_at']


class AgentConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing conversations"""

    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)
    messages_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AgentConversation
        fields = [
            'id',
            'marketplace',
            'marketplace_name',
            'status',
            'messages_count',
            'last_message',
            'created_at',
            'updated_at',
        ]

    def get_messages_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {
                'role': last.role,
                'content': last.content[:100] + '...' if len(last.content) > 100 else last.content,
                'created_at': last.created_at,
            }
        return None


class StartResearchSerializer(serializers.Serializer):
    """Serializer for starting research"""

    marketplace_id = serializers.IntegerField()
    initial_query = serializers.CharField(max_length=2000)


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending user message"""

    message = serializers.CharField(max_length=5000)


class PollMessagesSerializer(serializers.Serializer):
    """Serializer for polling messages"""

    since = serializers.DateTimeField(required=False)
