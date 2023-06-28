from rest_framework import viewsets
from rest_framework import mixins, generics
from apps.pages.models import HomeSlider, Pages
from apps.pages.serializers import HomeSliderSerializer, PagesSerializer, PagesSerializerLight
from rest_framework.response import Response


class HomeSliderViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = HomeSlider.objects.all()
    serializer_class = HomeSliderSerializer

    def get_queryset(self):
        return HomeSlider.objects.filter(is_active=True)


class PagesViewSet(generics.GenericAPIView, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.ViewSet):
    queryset = Pages
    serializer_class = PagesSerializer

    def get_queryset(self):
        return Pages.objects.all()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response(PagesSerializerLight(qs, many=True).data)

