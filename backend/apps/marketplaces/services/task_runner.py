import threading
import logging
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


class TaskRunner:
    """
    Run background tasks in threads.

    This is a simple threading-based task runner.
    For production scale, consider migrating to Celery.
    """

    _active_threads: dict = {}

    @classmethod
    def start_task(cls, task):
        """
        Start task in a background thread.

        Args:
            task: BackgroundTask instance
        """
        from apps.marketplaces.models import BackgroundTask

        if not isinstance(task, BackgroundTask):
            task = BackgroundTask.objects.get(id=task)

        thread = threading.Thread(
            target=cls._execute_task,
            args=(task.id,),
            name=f"task-{task.id}",
            daemon=True
        )

        cls._active_threads[task.id] = thread
        thread.start()

        logger.info(f"Started background task {task.id}: {task.name}")

    @classmethod
    def _execute_task(cls, task_id: int):
        """
        Execute task in background thread.

        This method runs in a separate thread and handles
        the complete lifecycle of a task.
        """
        from apps.marketplaces.models import BackgroundTask

        # Close any existing DB connections (important for threads)
        connection.close()

        try:
            task = BackgroundTask.objects.get(id=task_id)
            task.start()

            logger.info(f"Executing task {task_id}: {task.task_type}")

            if task.task_type == 'pipeline_run':
                result = cls._run_pipeline(task)
            elif task.task_type == 'research_agent':
                result = cls._run_research(task)
            elif task.task_type == 'sync_operation':
                result = cls._run_sync(task)
            else:
                raise ValueError(f"Unknown task type: {task.task_type}")

            task.complete(result)
            logger.info(f"Task {task_id} completed successfully")

        except Exception as e:
            logger.exception(f"Task {task_id} failed: {e}")
            try:
                task = BackgroundTask.objects.get(id=task_id)
                task.fail(str(e))
            except Exception:
                pass

        finally:
            cls._active_threads.pop(task_id, None)
            connection.close()

    @classmethod
    def _run_pipeline(cls, task) -> dict:
        """Execute pipeline run task"""
        from apps.marketplaces.models import PipelineRun
        from apps.marketplaces.services.pipeline_executor import PipelineExecutor

        pipeline_run_id = task.payload.get('pipeline_run_id')
        if not pipeline_run_id:
            raise ValueError("pipeline_run_id is required in payload")

        pipeline_run = PipelineRun.objects.get(id=pipeline_run_id)
        executor = PipelineExecutor(pipeline_run)

        # Set up progress callback
        def on_progress(percent, message):
            task.update_progress(percent, message)

        executor.on_progress = on_progress

        success = executor.execute()

        return {
            'success': success,
            'pipeline_run_id': pipeline_run_id,
            'completed_steps': pipeline_run.completed_steps_count,
            'total_steps': pipeline_run.total_steps_count,
        }

    @classmethod
    def _run_research(cls, task) -> dict:
        """Execute research agent task"""
        from apps.marketplaces.models import AgentConversation
        from apps.marketplaces.services.research_agent import MarketplaceResearchAgent

        conversation_id = task.payload.get('conversation_id')
        if not conversation_id:
            raise ValueError("conversation_id is required in payload")

        conversation = AgentConversation.objects.get(id=conversation_id)
        agent = MarketplaceResearchAgent(conversation)

        # Get initial query from payload
        initial_query = task.payload.get('initial_query')
        if initial_query:
            messages = agent.start_research(initial_query)
        else:
            # Continue processing (for async continuation)
            user_message = task.payload.get('user_message')
            if user_message:
                messages = agent.process_message(user_message)
            else:
                messages = []

        return {
            'conversation_id': conversation_id,
            'messages_created': len(messages),
            'status': conversation.status,
        }

    @classmethod
    def _run_sync(cls, task) -> dict:
        """Execute sync operation task"""
        from apps.marketplaces.models import Marketplace
        from apps.marketplaces.services import get_marketplace_client

        marketplace_id = task.payload.get('marketplace_id')
        sync_type = task.payload.get('sync_type', 'all')

        if not marketplace_id:
            raise ValueError("marketplace_id is required in payload")

        marketplace = Marketplace.objects.get(id=marketplace_id)
        client = get_marketplace_client(marketplace)

        results = {}

        if sync_type in ('all', 'categories'):
            task.update_progress(10, 'Syncing categories...')
            results['categories'] = client.sync_categories()

        if sync_type in ('all', 'attributes'):
            task.update_progress(40, 'Syncing attributes...')
            results['attributes'] = client.sync_attribute_sets()

        if sync_type in ('all', 'options'):
            task.update_progress(70, 'Syncing options...')
            results['options'] = client.sync_attribute_options()

        marketplace.update_last_sync()

        return {
            'marketplace_id': marketplace_id,
            'sync_type': sync_type,
            'results': results,
        }

    @classmethod
    def is_running(cls, task_id: int) -> bool:
        """Check if task is currently running"""
        thread = cls._active_threads.get(task_id)
        return thread is not None and thread.is_alive()

    @classmethod
    def cancel_task(cls, task_id: int) -> bool:
        """
        Request task cancellation.

        Note: This doesn't immediately stop the thread,
        but marks the task as cancelled. Long-running operations
        should check task status periodically.
        """
        from apps.marketplaces.models import BackgroundTask

        try:
            task = BackgroundTask.objects.get(id=task_id)
            return task.cancel()
        except BackgroundTask.DoesNotExist:
            return False

    @classmethod
    def get_active_tasks(cls) -> list:
        """Get list of currently running task IDs"""
        return [
            task_id for task_id, thread in cls._active_threads.items()
            if thread.is_alive()
        ]
