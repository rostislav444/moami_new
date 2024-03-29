import requests

from apps.integrations.models import ModnaKastaTolen, ModnaKastaLog


def get_mk_request_headers():
    token = ModnaKastaTolen.objects.first()

    if not token:
        raise Exception('Token does not exists')

    return {'Authorization': token.token}


def mk_request(url, payload):
    headers = get_mk_request_headers()
    response = requests.post(url, json=payload, headers=headers)

    status_code = response.status_code
    message = response.json()

    log_obj = ModnaKastaLog(
        status=status_code,
        url=url,
        message=message,
        payload=payload
    )
    log_obj.save()

    return {
        'status_code': status_code,
        'message': message
    }


def show_hide_sizes(skus, available):
    url = 'https://hub.modnakasta.ua/api/products/set-available/id'
    payload = {
        "items": [{"unique_sku_id": sku} for sku in skus],
        "available": available
    }
    mk_request(url, payload)


def update_stock(sku, stock):
    url = 'https://hub.modnakasta.ua/api/products/update-stock/id'
    payload = {
        'items': [{
            'unique_sku_id': sku,
            'stock': stock
        }]
    }
    mk_request(url, payload)



