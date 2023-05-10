from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework.authentication import SessionAuthentication


class SessionIdView(APIView):
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        session_id = request.session.session_key

        return Response({'session_id': session_id})