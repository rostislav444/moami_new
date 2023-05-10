from rest_framework import mixins, viewsets, generics
from apps.sizes.models import SizeGrid
from apps.sizes.serializers import SizeGridSerializer


class SizeGridViewSet(mixins.ListModelMixin, viewsets.GenericViewSet, generics.GenericAPIView):
    queryset = SizeGrid.objects.all()
    serializer_class = SizeGridSerializer
