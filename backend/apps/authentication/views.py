from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from project.settings import PRODUCTION


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "https://moami.com.ua/" if PRODUCTION else "http://127.0.0.1:3000/"
    client_class = OAuth2Client
