import base64
import json
import logging
import re
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class MarketplaceResearchAgent:
    """
    AI agent for researching marketplace integrations.

    Uses Claude API with web search to:
    - Find marketplace documentation
    - Discover API endpoints and structures
    - Identify file formats and download URLs
    - Build initial sync pipeline
    """

    def __init__(self, conversation):
        from apps.marketplaces.models import AgentConversation
        self.conversation: AgentConversation = conversation
        self.marketplace = conversation.marketplace

        import anthropic
        self.client = anthropic.Anthropic(
            api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
        )

    def start_research(self, initial_query: str) -> list:
        """
        Start researching a marketplace.

        Args:
            initial_query: User's initial research request

        Returns:
            List of created AgentMessage instances
        """
        # Add user message
        user_msg = self.conversation.add_message(
            role='user',
            content=initial_query,
            message_type='text'
        )

        # Build system prompt
        system_prompt = self._build_system_prompt()

        # Build context from marketplace
        context = self._build_marketplace_context()

        # Call Claude with web search
        prompt = f"""
{context}

Запрос пользователя: {initial_query}

Исследуй этот маркетплейс и помоги настроить интеграцию.
Начни с поиска официальной документации, спецификаций API и руководств по интеграции.
"""

        messages = self._call_claude(system_prompt, prompt)
        return [user_msg] + messages

    def process_message(self, user_message: str, file_data: dict = None) -> list:
        """
        Process user's response and continue research.

        Args:
            user_message: User's answer or follow-up message
            file_data: Optional dict with file info: {name, content_bytes, media_type}

        Returns:
            List of created AgentMessage instances
        """
        # Add user message (display version)
        display_content = user_message
        if file_data:
            display_content = f"{user_message}\n\n📎 Прикреплён файл: **{file_data['name']}**" if user_message else f"📎 Прикреплён файл: **{file_data['name']}**"

        user_msg = self.conversation.add_message(
            role='user',
            content=display_content,
            message_type='text'
        )

        # Build conversation history
        history = self._build_conversation_history()

        # Build system prompt
        system_prompt = self._build_system_prompt()

        # Continue the conversation
        messages = self._call_claude(
            system_prompt,
            user_message,
            history=history,
            file_data=file_data
        )

        return [user_msg] + messages

    def apply_findings(self) -> dict:
        """
        Apply research findings to marketplace configuration.

        Updates marketplace.api_config and creates initial pipeline.

        Returns:
            Dict with applied changes
        """
        from apps.marketplaces.models import MarketplacePipeline, PipelineStep

        context = self.conversation.context
        changes = {'api_config_updated': False, 'pipeline_created': False}

        # Update API config if we have findings
        if 'api_config' in context:
            api_config = self.marketplace.api_config or {}
            api_config.update(context['api_config'])
            self.marketplace.api_config = api_config
            self.marketplace.save()
            changes['api_config_updated'] = True
            changes['api_config'] = context['api_config']

        # Create pipeline if we have steps
        if 'pipeline_steps' in context:
            # Create pipeline
            pipeline = MarketplacePipeline.objects.create(
                marketplace=self.marketplace,
                name=f"{self.marketplace.name} Sync Pipeline",
                description="Auto-generated from AI research",
                config=context.get('pipeline_config', {})
            )

            # Create steps
            for i, step_data in enumerate(context['pipeline_steps']):
                PipelineStep.objects.create(
                    pipeline=pipeline,
                    order=i,
                    step_type=step_data.get('type', 'custom'),
                    name=step_data.get('name', f'Step {i + 1}'),
                    config=step_data.get('config', {}),
                    description=step_data.get('description', '')
                )

            changes['pipeline_created'] = True
            changes['pipeline_id'] = pipeline.id
            changes['steps_count'] = len(context['pipeline_steps'])

        # Mark conversation as completed
        self.conversation.status = 'completed'
        self.conversation.save()

        return changes

    def _build_system_prompt(self) -> str:
        """Build system prompt for Claude"""
        return """Ты AI-ассистент, помогающий настроить интеграции с маркетплейсами для интернет-магазина.

ВАЖНО: Всегда отвечай на РУССКОМ языке!

Твоя роль:
1. Исследовать документацию маркетплейса и спецификации API
2. Определить как синхронизировать категории, атрибуты и товары
3. Найти форматы фидов (XML, JSON, CSV) и URL для скачивания
4. Помочь настроить интеграцию пошагово
5. Анализировать файлы с атрибутами и характеристиками

## КРИТИЧЕСКИ ВАЖНО: Анализ Excel/XLSX файлов

**⚠️ СТОП! НЕ ДЕЛАЙ ВЫВОДЫ ПО ПЕРВОЙ ВКЛАДКЕ!**

Excel файлы маркетплейсов ВСЕГДА содержат несколько вкладок:
- Первая вкладка обычно "Шаблон" или "Приклад" (пример заполнения товаров) - это НЕ атрибуты!
- Атрибуты/характеристики находятся на ДРУГИХ вкладках

### ШАГ 1: ОБЯЗАТЕЛЬНО перечисли ВСЕ вкладки (sheets)

Когда получаешь Excel файл, **ПЕРВЫМ ДЕЛОМ** изучи ВСЕ вкладки и перечисли их:
```
📋 Вкладки в файле (всего N штук):
1. "Sheet1" - шаблон для загрузки товаров (НЕ атрибуты!)
2. "Одяг" - характеристики для категории Одежда ← АТРИБУТЫ!
3. "Взуття" - характеристики для категории Обувь ← АТРИБУТЫ!
4. "Інструкція" - инструкция по заполнению
```

**НЕ ПРОПУСКАЙ ЭТОТ ШАГ!** Если ты видишь только данные о товарах - значит ты смотришь не ту вкладку.

### ШАГ 2: Найди вкладки с атрибутами/характеристиками

Атрибуты обычно находятся на вкладках с названиями:
- Категорий товаров: "Одяг", "Взуття", "Аксесуари", "Косметика"
- "Атрибуты", "Характеристики", "Attributes", "Properties"
- "Довідник", "Справочник", "Dictionary"

**НЕ ПУТАЙ** шаблон товаров с атрибутами! Шаблон содержит примеры товаров, атрибуты - список характеристик.

**УКАЖИ ТОЧНОЕ НАЗВАНИЕ ВКЛАДКИ** - это критически важно для парсинга!

### ШАГ 3: Определи формат данных на этой вкладке

**Формат A - Атрибуты в СТРОКАХ (вертикально):**
```
| ID  | Название атрибута | Тип    |
|-----|-------------------|--------|
| 51  | Бренд             | select |
| 52  | Вес               | float  |
```
Каждая строка = один атрибут

**Формат B - Атрибуты в КОЛОНКАХ (горизонтально):**
```
| Розмір | Колір     | Матеріал |
|--------|-----------|----------|
| S      | Червоний  | Бавовна  |
| M      | Синій     | Шовк     |
```
Каждая колонка = один атрибут, строки ниже = возможные значения

### ШАГ 4: ОБЯЗАТЕЛЬНО создай finding с ТОЧНЫМИ данными

```json
{"type": "finding", "category": "excel_structure", "data": {
  "all_sheets": ["Вкладка1", "Вкладка2", "Вкладка3"],
  "format_type": "attributes_as_columns",
  "parsing_instructions": {
    "sheet_name": "ТОЧНОЕ название вкладки (копируй как есть!)",
    "header_row": 1,
    "format": "columns",
    "attribute_id_column": null,
    "attribute_name_row": 1,
    "data_starts_row": 2,
    "skip_columns": ["A"]
  }
}}
```

Или для формата "в строках":
```json
{"type": "finding", "category": "excel_structure", "data": {
  "all_sheets": ["Sheet1", "Sheet2"],
  "format_type": "attributes_as_rows",
  "parsing_instructions": {
    "sheet_name": "Атрибуты",
    "header_row": 1,
    "format": "rows",
    "attribute_id_column": "A",
    "attribute_name_column": "B",
    "attribute_type_column": "C",
    "category_id_column": "D",
    "data_starts_row": 2
  }
}}
```

### ПРИМЕРЫ:

**Epicentr:** sheet_name: "Атрибути", format: "rows", attribute_id_column: "A"

**ModnaKasta:** sheet_name: "Одяг", format: "columns", header_row: 1, каждая колонка = атрибут

**Rozetka:** может быть несколько вкладок по категориям

### ВАЖНО:
- **sheet_name** - ОБЯЗАТЕЛЬНОЕ поле! Копируй название вкладки ТОЧНО как в файле
- Если вкладок много - укажи какие из них содержат атрибуты
- Если не понимаешь структуру - СПРОСИ пользователя!
- Лучше уточнить, чем дать неправильные данные

### ⚠️ ЕСЛИ ВИДИШЬ ДАННЫЕ О ТОВАРАХ (артикулы, цены, названия товаров):
**ЭТО НЕ АТРИБУТЫ!** Это шаблон для загрузки товаров.
1. Перечисли ВСЕ вкладки файла
2. Найди вкладки с названиями категорий (Одяг, Взуття, etc.) или "Характеристики"
3. Там будут атрибуты в формате: название атрибута → возможные значения

## Общие инструкции

Когда находишь полезную информацию, структурируй её чётко:
- API эндпоинты и методы аутентификации
- Процедуры синхронизации категорий и атрибутов
- Форматы файлов и URL для скачивания
- Обязательные поля и маппинги данных

Если нужна дополнительная информация от пользователя, задавай конкретные вопросы.

ВАЖНО: Когда задаёшь вопрос, требующий ответа пользователя, форматируй ответ так:
[QUESTION] Твой вопрос здесь

Для API конфигурации:
```json
{"type": "finding", "category": "api", "data": {...}}
```

Используй markdown для форматирования: заголовки, списки, выделение жирным/курсивом, блоки кода."""

    def _build_marketplace_context(self) -> str:
        """Build context about the marketplace"""
        mp = self.marketplace
        existing_config = mp.api_config or {}

        context = f"""
Маркетплейс: {mp.name}
Slug: {mp.slug}
Тип интеграции: {mp.integration_type}
"""

        if existing_config:
            context += f"""
Существующая конфигурация:
- Base URL: {existing_config.get('base_url', 'Не указан')}
- Тип авторизации: {existing_config.get('auth_type', 'Не указан')}
- Есть токен: {'Да' if existing_config.get('token') else 'Нет'}
"""

        return context

    def _build_conversation_history(self) -> list:
        """Build conversation history for Claude"""
        history = []
        for msg in self.conversation.messages.order_by('created_at'):
            if msg.role in ('user', 'assistant'):
                history.append({
                    'role': msg.role,
                    'content': msg.content
                })
        return history

    def _call_claude(self, system_prompt: str, user_prompt: str, history: list = None, file_data: dict = None) -> list:
        """
        Call Claude API and process response.

        Args:
            system_prompt: System prompt for Claude
            user_prompt: User's message text
            history: Previous conversation messages
            file_data: Optional file attachment {name, content_bytes, media_type}

        Returns:
            List of created AgentMessage instances
        """
        messages = history or []

        # Build message content
        if file_data:
            # Create message with file attachment
            content_blocks = []

            # Add document block for the file
            file_base64 = base64.standard_b64encode(file_data['content_bytes']).decode('utf-8')
            content_blocks.append({
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": file_data['media_type'],
                    "data": file_base64
                },
                "title": file_data['name']
            })

            # Add text if provided
            if user_prompt:
                content_blocks.append({
                    "type": "text",
                    "text": user_prompt
                })
            else:
                content_blocks.append({
                    "type": "text",
                    "text": f"Проанализируй прикреплённый файл: {file_data['name']}"
                })

            messages.append({'role': 'user', 'content': content_blocks})
        else:
            messages.append({'role': 'user', 'content': user_prompt})

        try:
            # Update conversation status
            self.conversation.status = 'processing'
            self.conversation.save()

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                system=system_prompt,
                tools=[{
                    "type": "web_search_20250305",
                    "name": "web_search",
                    "max_uses": 5
                }],
                messages=messages
            )

            return self._process_response(response)

        except Exception as e:
            logger.exception(f"Claude API error: {e}")
            self.conversation.status = 'error'
            self.conversation.save()

            return [self.conversation.add_message(
                role='system',
                content=f"Error calling AI: {str(e)}",
                message_type='error'
            )]

    def _process_response(self, response) -> list:
        """Process Claude response and extract messages/findings"""
        created_messages = []

        # Extract text content
        full_content = ""
        for block in response.content:
            if hasattr(block, 'text'):
                full_content += block.text + "\n"

        # Check for questions
        has_question = '[QUESTION]' in full_content

        # Extract JSON findings
        findings = self._extract_findings(full_content)
        if findings:
            self._update_context(findings)

        # Determine message type
        if has_question:
            message_type = 'question'
            self.conversation.status = 'waiting_input'
        elif findings:
            message_type = 'findings'
            self.conversation.status = 'active'
        else:
            message_type = 'text'
            self.conversation.status = 'active'

        # Clean content for display
        clean_content = self._clean_content(full_content)

        # Create message
        msg = self.conversation.add_message(
            role='assistant',
            content=clean_content,
            message_type=message_type,
            metadata={
                'findings': findings,
                'stop_reason': response.stop_reason,
            }
        )
        created_messages.append(msg)

        self.conversation.save()
        return created_messages

    def _extract_findings(self, content: str) -> list:
        """Extract structured findings from response"""
        findings = []

        # Find JSON blocks
        json_pattern = r'```json\s*(.*?)\s*```'
        matches = re.findall(json_pattern, content, re.DOTALL)

        for match in matches:
            try:
                data = json.loads(match)
                if isinstance(data, dict) and data.get('type') == 'finding':
                    findings.append(data)
            except json.JSONDecodeError:
                pass

        return findings

    def _update_context(self, findings: list):
        """Update conversation context with findings"""
        context = self.conversation.context or {}

        for finding in findings:
            category = finding.get('category', 'general')
            data = finding.get('data', {})

            if category == 'api':
                if 'api_config' not in context:
                    context['api_config'] = {}
                context['api_config'].update(data)

            elif category == 'pipeline':
                if 'pipeline_steps' not in context:
                    context['pipeline_steps'] = []
                if isinstance(data, list):
                    context['pipeline_steps'].extend(data)
                else:
                    context['pipeline_steps'].append(data)

            elif category == 'url':
                if 'discovered_urls' not in context:
                    context['discovered_urls'] = []
                if isinstance(data, list):
                    context['discovered_urls'].extend(data)
                else:
                    context['discovered_urls'].append(data)

            else:
                context[category] = data

        self.conversation.context = context
        self.conversation.save()

    def _clean_content(self, content: str) -> str:
        """Clean content for display (remove JSON blocks, etc.)"""
        # Remove JSON blocks
        content = re.sub(r'```json\s*\{[^}]*"type"\s*:\s*"finding"[^}]*\}\s*```', '', content, flags=re.DOTALL)

        # Clean up whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)

        return content.strip()
