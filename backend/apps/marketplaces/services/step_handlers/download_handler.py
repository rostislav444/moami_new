import os
import tempfile
import requests
from typing import Optional
from .base import BaseStepHandler


class DownloadFileHandler(BaseStepHandler):
    """Handler for downloading files from URLs"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('url'):
            errors.append("'url' is required")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Download file from URL.

        Config:
            url: URL to download from (supports variables)
            save_as: Filename to save as (optional)
            timeout: Request timeout in seconds (default: 60)
            headers: Additional headers dict (optional)
            auth_type: 'bearer' | 'api_key' | None (optional)

        Returns:
            {
                'filepath': path to downloaded file,
                'filename': original filename,
                'size': file size in bytes,
                'content_type': MIME type
            }
        """
        config = self.resolve_config(config)

        url = config['url']
        timeout = config.get('timeout', 60)
        headers = config.get('headers', {})

        # Add auth if specified
        auth_type = config.get('auth_type')
        if auth_type == 'bearer' and self.marketplace.api_config.get('token'):
            headers['Authorization'] = f"Bearer {self.marketplace.api_config['token']}"
        elif auth_type == 'api_key' and self.marketplace.api_config.get('api_key'):
            headers['X-API-Key'] = self.marketplace.api_config['api_key']

        self.log_info(f"Downloading from {url}")

        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()

        # Determine filename
        filename = config.get('save_as')
        if not filename:
            # Try to get from Content-Disposition header
            cd = response.headers.get('content-disposition', '')
            if 'filename=' in cd:
                filename = cd.split('filename=')[1].strip('"\'')
            else:
                # Extract from URL
                filename = url.split('/')[-1].split('?')[0] or 'downloaded_file'

        # Create temp directory for marketplace
        temp_dir = os.path.join(
            tempfile.gettempdir(),
            'pipeline',
            str(self.marketplace.id)
        )
        os.makedirs(temp_dir, exist_ok=True)

        filepath = os.path.join(temp_dir, filename)

        # Download to file
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(filepath)
        content_type = response.headers.get('content-type', 'application/octet-stream')

        self.log_info(f"Downloaded {file_size} bytes to {filepath}")

        return {
            'filepath': filepath,
            'filename': filename,
            'size': file_size,
            'content_type': content_type,
        }
