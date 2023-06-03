import os
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATICFILE_DIR = os.path.join(BASE_DIR, 'static')

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

print('PRODUCTION', env('PRODUCTION'))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-hm#r1xssp!bmbqka4mxgtzfe#)ugfo*i6#1pf#oq!hx)xpo8xb'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
PRODUCTION = env('PRODUCTION') == 'true'

ALLOWED_HOSTS = [
    '212.8.246.22',
    'moami.com.ua',
    '0.0.0.0',
    'localhost',
    '127.1.0.1',
    'localhost:3000'
]

# Application definition

INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Apps
    'apps.abstract.apps.AbstractConfig',
    'apps.attributes.apps.AttributesConfig',
    'apps.catalogue.apps.CatalogueConfig',
    'apps.categories.apps.CategoriesConfig',
    'apps.core.apps.CoreConfig',
    'apps.order.apps.OrderConfig',
    'apps.pages.apps.PagesConfig',
    'apps.product.apps.ProductConfig',
    'apps.integrations.apps.IntegrationsConfig',
    'apps.newpost.apps.NewpostConfig',
    'apps.sizes.apps.SizesConfig',
    'apps.translation.apps.TranslationConfig',
    'apps.user.apps.UserConfig',
    # Third party libraries
    'corsheaders',
    'rest_framework',
    'nested_inline',
    'mptt',
    'adminsortable'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates']
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.static',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'project.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': '0.0.0.0',
        'PORT': env('DB_PORT') or 5432,
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

DISABLE_DARK_MODE = True

# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'ru'
LANGUAGES = (
    ('uk', 'Ukrainian'),
    ('ru', 'Russian'),
    ('en', 'English')
)
FOREIGN_LANGUAGES = [lang for lang in LANGUAGES if lang[0] != LANGUAGE_CODE]
FOREIGN_LANGUAGES_COUNT = len(FOREIGN_LANGUAGES)

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static_root/')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')
STATICFILES_DIRS = [
    STATICFILE_DIR,
]
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    # Set default authentication
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    # Set default permission
    'DEFAULT_PERMISSION_CLASSES': [],
    # Set default accepted_renderer
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # Set default accepted_parser
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

AUTH_USER_MODEL = 'user.User'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    'http://localhost:3000',
]

# Use the custom session auth token
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True
