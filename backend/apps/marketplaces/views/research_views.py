import io
import chardet
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.marketplaces.models import Marketplace, AgentConversation, AgentMessage, BackgroundTask
from apps.marketplaces.serializers import (
    AgentConversationSerializer,
    AgentConversationListSerializer,
    AgentMessageSerializer,
    StartResearchSerializer,
    SendMessageSerializer,
)
from apps.marketplaces.services.research_agent import MarketplaceResearchAgent
from apps.marketplaces.services.task_runner import TaskRunner


def extract_file_content(uploaded_file, max_chars=50000):
    """Extract text content from uploaded file"""
    filename = uploaded_file.name.lower()
    content = uploaded_file.read()

    # Handle PDF files
    if filename.endswith('.pdf'):
        try:
            import pypdf
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text() or '')
            text = '\n\n'.join(text_parts)
        except ImportError:
            text = "[PDF parsing unavailable - pypdf not installed]"
        except Exception as e:
            text = f"[Error parsing PDF: {str(e)}]"
    else:
        # Detect encoding for text files
        detected = chardet.detect(content)
        encoding = detected.get('encoding', 'utf-8') or 'utf-8'

        try:
            text = content.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            text = content.decode('utf-8', errors='replace')

    # Truncate if too long
    if len(text) > max_chars:
        text = text[:max_chars] + f"\n\n... (обрезано, файл содержит {len(content)} байт)"

    return text


class ResearchViewSet(viewsets.ModelViewSet):
    """
    ViewSet для AI Research Agent

    Endpoints:
    - GET /api/marketplaces/research/ - список разговоров
    - POST /api/marketplaces/research/start/ - начать исследование
    - GET /api/marketplaces/research/{id}/ - получить разговор с сообщениями
    - POST /api/marketplaces/research/{id}/send/ - отправить ответ
    - POST /api/marketplaces/research/{id}/upload/ - загрузить файл
    - GET /api/marketplaces/research/{id}/poll/ - polling новых сообщений
    - POST /api/marketplaces/research/{id}/apply/ - применить результаты
    """

    queryset = AgentConversation.objects.all()
    serializer_class = AgentConversationSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return AgentConversationListSerializer
        return AgentConversationSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('marketplace')

        # Filter by marketplace if specified
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        return queryset.prefetch_related('messages')

    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        Начать новое исследование маркетплейса

        POST /api/marketplaces/research/start/
        Body: {
            "marketplace_id": 1,
            "initial_query": "Исследуй интеграцию с Rozetka"
        }
        """
        serializer = StartResearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        marketplace_id = serializer.validated_data['marketplace_id']
        initial_query = serializer.validated_data['initial_query']

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create conversation
        conversation = AgentConversation.objects.create(
            marketplace=marketplace,
            status='active'
        )

        # Start research agent in background
        task = BackgroundTask.create_for_research(conversation)
        task.payload['initial_query'] = initial_query
        task.save()

        TaskRunner.start_task(task)

        return Response({
            'conversation_id': conversation.id,
            'task_id': task.id,
            'status': 'started',
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Отправить ответ пользователя

        POST /api/marketplaces/research/{id}/send/
        Body: {
            "message": "Вот URL документации: ..."
        }
        """
        conversation = self.get_object()

        if conversation.status not in ('active', 'waiting_input'):
            return Response(
                {'error': f'Cannot send message to conversation with status: {conversation.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data['message']

        # Process message synchronously for quick responses
        agent = MarketplaceResearchAgent(conversation)
        messages = agent.process_message(user_message)

        return Response({
            'messages': AgentMessageSerializer(messages, many=True).data,
            'status': conversation.status,
            'context': conversation.context,
        })

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request, pk=None):
        """
        Загрузить файл и отправить его содержимое в чат

        POST /api/marketplaces/research/{id}/upload/
        Body (multipart/form-data): {
            "file": <file>,
            "message": "Вот пример XML фида" (optional)
        }
        """
        conversation = self.get_object()

        if conversation.status not in ('active', 'waiting_input'):
            return Response(
                {'error': f'Cannot upload to conversation with status: {conversation.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check file size (max 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 10MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Read file content
        file_content = uploaded_file.read()
        filename = uploaded_file.name
        user_text = request.data.get('message', '').strip()

        # Determine media type
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        media_type_map = {
            'pdf': 'application/pdf',
            'xml': 'application/xml',
            'json': 'application/json',
            'csv': 'text/csv',
            'txt': 'text/plain',
            'html': 'text/html',
            'md': 'text/markdown',
            'yaml': 'application/x-yaml',
            'yml': 'application/x-yaml',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
        }
        media_type = media_type_map.get(ext, 'application/octet-stream')

        # Prepare file data for Claude
        file_data = {
            'name': filename,
            'content_bytes': file_content,
            'media_type': media_type,
        }

        # Process with agent - pass file directly to Claude
        agent = MarketplaceResearchAgent(conversation)
        messages = agent.process_message(user_text, file_data=file_data)

        return Response({
            'messages': AgentMessageSerializer(messages, many=True).data,
            'status': conversation.status,
            'context': conversation.context,
            'file_name': filename,
            'file_size': uploaded_file.size,
        })

    @action(detail=True, methods=['get'])
    def poll(self, request, pk=None):
        """
        Polling для новых сообщений

        GET /api/marketplaces/research/{id}/poll/?since=2026-02-07T10:00:00Z
        """
        conversation = self.get_object()

        since = request.query_params.get('since')
        if since:
            try:
                since_dt = timezone.datetime.fromisoformat(since.replace('Z', '+00:00'))
                messages = conversation.get_messages_since(since_dt)
            except ValueError:
                messages = conversation.messages.none()
        else:
            messages = conversation.messages.all()

        return Response({
            'status': conversation.status,
            'messages': AgentMessageSerializer(messages, many=True).data,
            'context': conversation.context,
        })

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """
        Применить результаты исследования

        POST /api/marketplaces/research/{id}/apply/
        """
        conversation = self.get_object()

        if conversation.status not in ('active', 'waiting_input', 'completed'):
            return Response(
                {'error': f'Cannot apply findings from conversation with status: {conversation.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purpose = request.data.get('purpose', 'other')
        agent = MarketplaceResearchAgent(conversation)
        changes = agent.apply_findings(purpose=purpose)

        return Response({
            'success': True,
            'changes': changes,
        })

    @action(detail=True, methods=['post'])
    def continue_async(self, request, pk=None):
        """
        Продолжить исследование в фоновом режиме

        POST /api/marketplaces/research/{id}/continue_async/
        Body: {
            "message": "Продолжи поиск атрибутов"
        }
        """
        conversation = self.get_object()

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data['message']

        # Add user message immediately
        conversation.add_message(
            role='user',
            content=user_message,
            message_type='text'
        )

        # Start research continuation in background
        task = BackgroundTask.create_for_research(conversation)
        task.payload['user_message'] = user_message
        task.save()

        TaskRunner.start_task(task)

        return Response({
            'task_id': task.id,
            'status': 'processing',
        })
