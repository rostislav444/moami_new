from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from rest_framework import viewsets, mixins, generics

from apps.core.utils.cache import cache_per_view_and_locale
from apps.newpost.models import NewPostAreas, NewPostCities, NewPostDepartments
from apps.newpost.serializer import NewPostAreasSerializer, NewPostCitiesSerializer, NewPostDepartmentsSerializer


@method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
@method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class NewPostAreasViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    serializer_class = NewPostAreasSerializer

    def get_queryset(self):
        return NewPostAreas.objects.all()


@method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
@method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class NewPostCitiesViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    serializer_class = NewPostCitiesSerializer

    def get_queryset(self):
        area = self.request.GET.get('area')
        print(area)
        qs = NewPostCities.objects.filter(departments__isnull=False).distinct()
        if area:
            area = NewPostAreas.objects.get(ref=area)
            return qs.filter(area=area)
        return NewPostCities.objects.all()


@method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
@method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class NewPostDepartmentsViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    serializer_class = NewPostDepartmentsSerializer

    def get_queryset(self):
        city = self.request.GET.get('city')
        if city:
            return NewPostDepartments.objects.filter(city__ref=city)
        return NewPostDepartments.objects.all()
