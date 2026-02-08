from abc import ABC, abstractmethod
from typing import Any
import logging
import re

logger = logging.getLogger(__name__)


class BaseStepHandler(ABC):
    """Base class for pipeline step handlers"""

    def __init__(self, marketplace):
        self.marketplace = marketplace

    @abstractmethod
    def execute(self, config: dict) -> dict:
        """
        Execute step and return result.

        Args:
            config: Step configuration dict

        Returns:
            dict with step result data
        """
        pass

    @abstractmethod
    def validate_config(self, config: dict) -> list[str]:
        """
        Validate step configuration.

        Args:
            config: Step configuration dict

        Returns:
            List of error messages (empty if valid)
        """
        pass

    def resolve_variables(self, value: str) -> str:
        """
        Resolve variables in string value.

        Supports:
            {marketplace.api_config.base_url}
            {marketplace.slug}
            {env.SOME_VAR}
            {step.previous_result.filepath}
        """
        if not isinstance(value, str):
            return value

        def replace_var(match):
            path = match.group(1)
            parts = path.split('.')

            if parts[0] == 'marketplace':
                obj = self.marketplace
                for part in parts[1:]:
                    if hasattr(obj, part):
                        obj = getattr(obj, part)
                    elif isinstance(obj, dict) and part in obj:
                        obj = obj[part]
                    else:
                        return match.group(0)  # Return original if not found
                return str(obj) if obj is not None else ''

            elif parts[0] == 'env':
                import os
                return os.environ.get(parts[1], '')

            return match.group(0)

        pattern = r'\{([^}]+)\}'
        return re.sub(pattern, replace_var, value)

    def resolve_config(self, config: dict) -> dict:
        """Resolve all variables in config dict"""
        resolved = {}
        for key, value in config.items():
            if isinstance(value, str):
                resolved[key] = self.resolve_variables(value)
            elif isinstance(value, dict):
                resolved[key] = self.resolve_config(value)
            elif isinstance(value, list):
                resolved[key] = [
                    self.resolve_variables(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                resolved[key] = value
        return resolved

    def log_info(self, message: str):
        """Log info message with step context"""
        logger.info(f"[{self.__class__.__name__}] {message}")

    def log_error(self, message: str):
        """Log error message with step context"""
        logger.error(f"[{self.__class__.__name__}] {message}")
