from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from apps.user.models import User
from django.db.models import Q


class SettingsBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        # Attempt to fetch the user by email, phone, or username
        try:
            user = User.objects.get(
                Q(email=username) | Q(phone=username) | Q(username=username)
            )
            if user and check_password(password, user.password):
                return user
        except User.DoesNotExist:
            pass
        except User.MultipleObjectsReturned:
            # Handle the case where multiple users have the same email/phone/username.
            # This shouldn't happen if your database constraints are set correctly.
            pass

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
