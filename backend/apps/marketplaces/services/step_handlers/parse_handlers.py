import json
import csv
import xml.etree.ElementTree as ET
from typing import Any
from .base import BaseStepHandler


class ParseXMLHandler(BaseStepHandler):
    """Handler for parsing XML files"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('filepath') and not config.get('use_previous'):
            errors.append("'filepath' is required or 'use_previous' must be true")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Parse XML file.

        Config:
            filepath: Path to XML file
            use_previous: Use filepath from previous step result
            root_element: XPath to root element for items (optional)
            item_element: XPath to item elements (optional)
            extract: Dict mapping field names to XPath expressions (optional)

        Returns:
            {
                'items_count': number of items found,
                'items': parsed items (if extract specified),
                'root_tag': root element tag name,
                'structure': detected structure info
            }
        """
        config = self.resolve_config(config)

        filepath = config.get('filepath')
        if not filepath:
            raise ValueError("No filepath specified")

        self.log_info(f"Parsing XML from {filepath}")

        tree = ET.parse(filepath)
        root = tree.getroot()

        result = {
            'root_tag': root.tag,
            'children_count': len(root),
        }

        # If item_element specified, extract items
        item_element = config.get('item_element')
        if item_element:
            items = root.findall(item_element)
            result['items_count'] = len(items)

            # If extract mapping specified, extract fields
            extract = config.get('extract')
            if extract and items:
                parsed_items = []
                for item in items[:config.get('limit', 1000)]:
                    parsed = {}
                    for field_name, xpath in extract.items():
                        elem = item.find(xpath)
                        parsed[field_name] = elem.text if elem is not None else None
                    parsed_items.append(parsed)
                result['items'] = parsed_items

        # Detect structure
        if len(root) > 0:
            first_child = root[0]
            result['structure'] = {
                'first_child_tag': first_child.tag,
                'first_child_attribs': dict(first_child.attrib),
                'sample_children': [child.tag for child in first_child[:5]]
            }

        self.log_info(f"Parsed XML: {result.get('items_count', len(root))} items")
        return result


class ParseJSONHandler(BaseStepHandler):
    """Handler for parsing JSON files"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('filepath') and not config.get('use_previous'):
            errors.append("'filepath' is required or 'use_previous' must be true")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Parse JSON file.

        Config:
            filepath: Path to JSON file
            use_previous: Use filepath from previous step result
            items_path: JSONPath-like path to items array (e.g., "data.items")
            extract: Dict mapping field names to paths (optional)

        Returns:
            {
                'items_count': number of items,
                'items': parsed items,
                'structure': detected structure info
            }
        """
        config = self.resolve_config(config)

        filepath = config.get('filepath')
        if not filepath:
            raise ValueError("No filepath specified")

        self.log_info(f"Parsing JSON from {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        result = {
            'type': type(data).__name__,
        }

        # Navigate to items path
        items_path = config.get('items_path')
        if items_path:
            items = data
            for key in items_path.split('.'):
                if isinstance(items, dict):
                    items = items.get(key, [])
                elif isinstance(items, list) and key.isdigit():
                    items = items[int(key)]
                else:
                    items = []
                    break
        else:
            items = data if isinstance(data, list) else [data]

        result['items_count'] = len(items) if isinstance(items, list) else 1
        result['items'] = items[:config.get('limit', 1000)] if isinstance(items, list) else items

        # Detect structure
        if isinstance(data, dict):
            result['structure'] = {
                'keys': list(data.keys())[:20],
                'types': {k: type(v).__name__ for k, v in list(data.items())[:10]}
            }

        self.log_info(f"Parsed JSON: {result['items_count']} items")
        return result


class ParseCSVHandler(BaseStepHandler):
    """Handler for parsing CSV files"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('filepath') and not config.get('use_previous'):
            errors.append("'filepath' is required or 'use_previous' must be true")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Parse CSV file.

        Config:
            filepath: Path to CSV file
            use_previous: Use filepath from previous step result
            delimiter: CSV delimiter (default: auto-detect)
            encoding: File encoding (default: utf-8)
            has_header: Whether first row is header (default: True)

        Returns:
            {
                'items_count': number of rows,
                'headers': column headers,
                'items': parsed rows as dicts
            }
        """
        config = self.resolve_config(config)

        filepath = config.get('filepath')
        if not filepath:
            raise ValueError("No filepath specified")

        self.log_info(f"Parsing CSV from {filepath}")

        encoding = config.get('encoding', 'utf-8')
        delimiter = config.get('delimiter')
        has_header = config.get('has_header', True)

        # Auto-detect delimiter if not specified
        if not delimiter:
            with open(filepath, 'r', encoding=encoding) as f:
                sample = f.read(4096)
                if '\t' in sample:
                    delimiter = '\t'
                elif ';' in sample:
                    delimiter = ';'
                else:
                    delimiter = ','

        items = []
        headers = []

        with open(filepath, 'r', encoding=encoding, newline='') as f:
            reader = csv.reader(f, delimiter=delimiter)

            if has_header:
                headers = next(reader, [])

            for i, row in enumerate(reader):
                if i >= config.get('limit', 10000):
                    break
                if has_header:
                    items.append(dict(zip(headers, row)))
                else:
                    items.append(row)

        result = {
            'items_count': len(items),
            'headers': headers,
            'items': items,
            'delimiter': delimiter,
        }

        self.log_info(f"Parsed CSV: {len(items)} rows, {len(headers)} columns")
        return result
