from django.views.decorators.cache import cache_page


def cache_per_view_and_locale(timeout):
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            # Append the language and the path to the cache key
            key_prefix = "{}__{}".format(request.LANGUAGE_CODE, request.path)
            return cache_page(timeout, key_prefix=key_prefix)(func)(request, *args, **kwargs)

        return wrapper

    return decorator
