import requests
import json
import time
from typing import Dict, List, Any

def fetch_epicentr_categories(start_page: int = 1, end_page: int = 108) -> Dict[str, Any]:
    """
    Собирает данные категорий с API Epicentr со всех страниц
    
    Args:
        start_page: Начальная страница (по умолчанию 1)
        end_page: Конечная страница (по умолчанию 108)
    
    Returns:
        Dict содержащий все собранные данные
    """
    
    base_url = "https://api.epicentrm.com.ua/v1/pim/attribute-sets"
    all_data = {
        "categories": [],
        "metadata": {
            "total_pages": end_page - start_page + 1,
            "pages_processed": 0,
            "errors": []
        }
    }
    
    # Заголовки для запросов с Bearer токеном
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
        'Authorization': 'Bearer 5a6489d1a5c48c9d174bd31f2a0a8fd0'
    }
    
    print(f"Начинаем сбор данных со страницы {start_page} по {end_page}")
    
    for page in range(start_page, end_page + 1):
        try:
            # Формируем URL с правильным форматом параметров
            url = f"{base_url}?page={page}"
            
            print(f"Обрабатываем страницу {page}... ", end="")
            
            # Делаем запрос
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()  # Вызовет исключение для HTTP ошибок
            
            # Парсим JSON
            page_data = response.json()
            
            # Добавляем данные в общий массив
            if 'data' in page_data:
                all_data["categories"].extend(page_data['data'])
                print(f"✓ Получено {len(page_data['data'])} категорий")
            else:
                all_data["categories"].append(page_data)
                print("✓ Данные добавлены")
            
            all_data["metadata"]["pages_processed"] += 1
            
            # Небольшая задержка между запросами
            time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Ошибка при запросе страницы {page}: {str(e)}"
            print(f"✗ {error_msg}")
            all_data["metadata"]["errors"].append({
                "page": page,
                "error": error_msg
            })
            
        except json.JSONDecodeError as e:
            error_msg = f"Ошибка парсинга JSON на странице {page}: {str(e)}"
            print(f"✗ {error_msg}")
            all_data["metadata"]["errors"].append({
                "page": page,
                "error": error_msg
            })
        
        except Exception as e:
            error_msg = f"Неожиданная ошибка на странице {page}: {str(e)}"
            print(f"✗ {error_msg}")
            all_data["metadata"]["errors"].append({
                "page": page,
                "error": error_msg
            })
    
    return all_data

def save_to_file(data: Dict[str, Any], filename: str = "epicentr_attrs.json") -> None:
    """
    Сохраняет данные в JSON файл
    
    Args:
        data: Данные для сохранения
        filename: Имя файла (по умолчанию epicentr_attrs.json)
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\nДанные сохранены в файл: {filename}")
    except Exception as e:
        print(f"\nОшибка при сохранении файла: {str(e)}")

def main():
    """Основная функция"""
    print("=== Сбор категорий Epicentr ===\n")
    
    # Собираем данные
    categories_data = fetch_epicentr_categories(1, 108)
    
    # Выводим статистику
    print(f"\n=== Результаты ===")
    print(f"Всего категорий собрано: {len(categories_data['categories'])}")
    print(f"Страниц обработано: {categories_data['metadata']['pages_processed']}")
    print(f"Ошибок: {len(categories_data['metadata']['errors'])}")
    
    if categories_data['metadata']['errors']:
        print("\nСписок ошибок:")
        for error in categories_data['metadata']['errors']:
            print(f"  Страница {error['page']}: {error['error']}")
    
    # Сохраняем в файл
    save_to_file(categories_data)
    
    print("\nГотово! ✓")


main()