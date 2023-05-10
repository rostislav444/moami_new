from django.urls import path
from .views import SessionIdView

urlpatterns = [
    path('get-session-id/', SessionIdView.as_view()),
]