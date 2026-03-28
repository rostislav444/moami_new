import logging
import time
from typing import Optional, Callable
from django.utils import timezone

logger = logging.getLogger(__name__)


class PipelineExecutor:
    """
    Executes marketplace sync pipelines.

    Runs each step in order, handling errors according to step config.
    Reports progress via callback.
    """

    def __init__(self, pipeline_run):
        from apps.marketplaces.models import PipelineRun
        self.run: PipelineRun = pipeline_run
        self.pipeline = pipeline_run.pipeline
        self.marketplace = pipeline_run.pipeline.marketplace
        self.on_progress: Optional[Callable[[int, str], None]] = None
        self._previous_result: dict = {}
        self._cancelled = False

    def execute(self) -> bool:
        """
        Execute all enabled steps in order.

        Returns:
            True if completed successfully, False otherwise
        """
        from apps.marketplaces.services.step_handlers import get_handler

        self.run.status = 'running'
        self.run.started_at = timezone.now()
        self.run.progress = {}
        self.run.save()

        steps = list(self.pipeline.steps.filter(is_enabled=True).order_by('order'))
        total_steps = len(steps)

        if total_steps == 0:
            logger.warning(f"Pipeline {self.pipeline.id} has no enabled steps")
            self.run.status = 'completed'
            self.run.finished_at = timezone.now()
            self.run.save()
            return True

        logger.info(f"Starting pipeline {self.pipeline.name} with {total_steps} steps")

        try:
            for index, step in enumerate(steps):
                if self._check_cancelled():
                    self.run.status = 'cancelled'
                    break

                # Update progress
                progress_percent = int((index / total_steps) * 100)
                self._update_progress(progress_percent, f"Running: {step.name}")

                # Update current step
                self.run.current_step = step
                self.run.progress[str(step.id)] = {'status': 'running', 'started_at': timezone.now().isoformat()}
                self.run.save()

                # Execute step
                success = self._execute_step(step)

                if not success and step.on_error == 'stop':
                    self.run.status = 'failed'
                    break

            else:
                # All steps completed
                self.run.status = 'completed'
                self._update_progress(100, 'Completed')

        except Exception as e:
            logger.exception(f"Pipeline execution failed: {e}")
            self.run.status = 'failed'
            self.run.error_message = str(e)

        finally:
            self.run.current_step = None
            self.run.finished_at = timezone.now()
            self.run.save()

        logger.info(f"Pipeline {self.pipeline.name} finished with status: {self.run.status}")
        return self.run.status == 'completed'

    def _execute_step(self, step) -> bool:
        """
        Execute a single step with retry logic.

        Returns:
            True if step completed successfully, False otherwise
        """
        from apps.marketplaces.services.step_handlers import get_handler

        step_start = time.time()
        retries = 0
        max_retries = step.retry_count if step.on_error == 'retry' else 0

        while True:
            try:
                # Get handler for step type
                handler = get_handler(step.step_type, self.marketplace)

                # Validate config
                errors = handler.validate_config(step.config)
                if errors:
                    raise ValueError(f"Invalid config: {', '.join(errors)}")

                # Inject previous result if needed
                config = dict(step.config)
                if config.get('use_previous') and self._previous_result:
                    config['filepath'] = self._previous_result.get('filepath')
                    config['data'] = (
                        self._previous_result.get('extracted')
                        or self._previous_result.get('items')
                        or self._previous_result.get('data')
                    )

                # Execute
                result = handler.execute(config)

                # Store result for next step
                self._previous_result = result

                # Update progress
                duration = time.time() - step_start
                self.run.progress[str(step.id)] = {
                    'status': 'completed',
                    'result': self._serialize_result(result),
                    'duration': round(duration, 2),
                }
                self.run.save()

                logger.info(f"Step '{step.name}' completed in {duration:.2f}s")
                return True

            except Exception as e:
                logger.error(f"Step '{step.name}' failed: {e}")

                if retries < max_retries:
                    retries += 1
                    logger.info(f"Retrying step '{step.name}' ({retries}/{max_retries})")
                    time.sleep(2 ** retries)  # Exponential backoff
                    continue

                # Record failure
                duration = time.time() - step_start
                self.run.progress[str(step.id)] = {
                    'status': 'failed',
                    'error': str(e),
                    'duration': round(duration, 2),
                }
                self.run.error_message = f"Step '{step.name}' failed: {e}"
                self.run.save()

                if step.on_error == 'skip':
                    logger.info(f"Skipping failed step '{step.name}' and continuing")
                    return True  # Continue to next step

                return False

    def _serialize_result(self, result: dict) -> dict:
        """Serialize step result for JSON storage"""
        serialized = {}
        for key, value in result.items():
            if key == 'items' and isinstance(value, list):
                # Don't store large item lists
                serialized['items_count'] = len(value)
            elif isinstance(value, (str, int, float, bool, type(None))):
                serialized[key] = value
            elif isinstance(value, (list, dict)):
                # Truncate large collections
                if isinstance(value, list) and len(value) > 10:
                    serialized[key] = value[:10]
                    serialized[f'{key}_truncated'] = True
                elif isinstance(value, dict) and len(value) > 20:
                    serialized[key] = dict(list(value.items())[:20])
                    serialized[f'{key}_truncated'] = True
                else:
                    serialized[key] = value
            else:
                serialized[key] = str(value)
        return serialized

    def _update_progress(self, percent: int, message: str):
        """Update progress via callback if set"""
        if self.on_progress:
            try:
                self.on_progress(percent, message)
            except Exception as e:
                logger.warning(f"Progress callback failed: {e}")

    def _check_cancelled(self) -> bool:
        """Check if pipeline run was cancelled"""
        if self._cancelled:
            return True

        # Refresh from DB to check status
        self.run.refresh_from_db()
        if self.run.status == 'cancelled':
            self._cancelled = True
            return True

        return False

    def cancel(self):
        """Request pipeline cancellation"""
        self._cancelled = True
        self.run.status = 'cancelled'
        self.run.save()
