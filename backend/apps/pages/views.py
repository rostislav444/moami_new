from rest_framework import viewsets
from rest_framework import mixins, generics
from apps.pages.models import HomeSlider
from apps.pages.serializers import HomeSliderSerializer


class HomeSliderViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = HomeSlider.objects.all()
    serializer_class = HomeSliderSerializer

    def get_queryset(self):
        return HomeSlider.objects.filter(is_active=True)
