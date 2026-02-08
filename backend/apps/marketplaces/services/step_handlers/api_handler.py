import requests
from .base import BaseStepHandler


class APICallHandler(BaseStepHandler):
    """Handler for making API calls"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('url') and not config.get('endpoint'):
            errors.append("'url' or 'endpoint' is required")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Make API call.

        Config:
            url: Full URL to call
            endpoint: Endpoint path (will be appended to marketplace base_url)
            method: HTTP method (default: GET)
            headers: Additional headers dict
            params: Query parameters dict
            body: Request body (for POST/PUT/PATCH)
            auth_type: 'bearer' | 'api_key' | None
            timeout: Request timeout in seconds (default: 30)
            extract_path: JSONPath-like path to extract from response

        Returns:
            {
                'status_code': HTTP status code,
                'data': response data (parsed JSON or text),
                'headers': response headers
            }
        """
        config = self.resolve_config(config)

        # Build URL
        url = config.get('url')
        if not url:
            base_url = self.marketplace.api_config.get('base_url', '')
            endpoint = config.get('endpoint', '')
            url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"

        method = config.get('method', 'GET').upper()
        timeout = config.get('timeout', 30)
        headers = config.get('headers', {})
        params = config.get('params', {})
        body = config.get('body')

        # Add auth
        auth_type = config.get('auth_type')
        if auth_type == 'bearer' and self.marketplace.api_config.get('token'):
            headers['Authorization'] = f"Bearer {self.marketplace.api_config['token']}"
        elif auth_type == 'api_key' and self.marketplace.api_config.get('api_key'):
            headers['X-API-Key'] = self.marketplace.api_config['api_key']

        # Add default Content-Type for JSON body
        if body and 'Content-Type' not in headers:
            headers['Content-Type'] = 'application/json'

        self.log_info(f"{method} {url}")

        # Make request
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            json=body if isinstance(body, (dict, list)) else None,
            data=body if isinstance(body, str) else None,
            timeout=timeout
        )

        # Parse response
        try:
            data = response.json()
        except Exception:
            data = response.text

        result = {
            'status_code': response.status_code,
            'data': data,
            'headers': dict(response.headers),
        }

        # Extract specific path if specified
        extract_path = config.get('extract_path')
        if extract_path and isinstance(data, dict):
            extracted = data
            for key in extract_path.split('.'):
                if isinstance(extracted, dict):
                    extracted = extracted.get(key)
                elif isinstance(extracted, list) and key.isdigit():
                    extracted = extracted[int(key)]
                else:
                    extracted = None
                    break
            result['extracted'] = extracted

        # Check for errors
        if response.status_code >= 400:
            raise Exception(f"API error: {response.status_code} - {data}")

        self.log_info(f"Response: {response.status_code}")
        return result
