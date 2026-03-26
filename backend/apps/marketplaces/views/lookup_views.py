from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count

from apps.product.models import Brand, Country, Color
from apps.attributes.models import AttributeGroup, Attribute, Composition
from apps.categories.models import Category, CategoryAttributeGroup
from apps.sizes.models import Size, SizeInterpretation


@api_view(['GET'])
def lookup_brands(request):
    brands = Brand.objects.all().order_by('name').values('id', 'name')
    return Response(list(brands))


@api_view(['GET'])
def lookup_countries(request):
    countries = Country.objects.all().order_by('name').values('id', 'name')
    return Response(list(countries))


@api_view(['GET'])
def lookup_colors(request):
    colors = Color.objects.all().order_by('name').values('id', 'name', 'code')
    return Response(list(colors))


@api_view(['GET'])
def lookup_categories(request):
    """Category tree — flat list with level + parent + size_group"""
    categories = Category.objects.all().order_by('tree_id', 'lft').values(
        'id', 'name', 'level', 'parent_id', 'size_group_id'
    )
    return Response(list(categories))


@api_view(['GET'])
def lookup_sizes(request):
    """Sizes filtered by size_group, with interpretations"""
    size_group_id = request.query_params.get('size_group')
    if not size_group_id:
        return Response([])

    sizes = Size.objects.filter(group_id=size_group_id).order_by('order')
    result = []
    for s in sizes:
        interpretations = {}
        for interp in s.interpretations.select_related('grid').all():
            interpretations[interp.grid.slug] = interp.value
        result.append({
            'id': s.id,
            'name': str(s),
            'interpretations': interpretations,
        })
    return Response(result)


@api_view(['GET'])
def lookup_compositions(request):
    compositions = Composition.objects.all().order_by('name').values('id', 'name')
    return Response(list(compositions))


@api_view(['GET'])
def lookup_attribute_groups(request):
    """Attribute groups for a category (including ancestors), with their attributes"""
    category_id = request.query_params.get('category')
    if not category_id:
        return Response([])

    try:
        category = Category.objects.get(pk=category_id)
    except Category.DoesNotExist:
        return Response([])

    # Get category + ancestors
    ancestor_ids = list(category.get_ancestors(include_self=True).values_list('id', flat=True))

    cags = CategoryAttributeGroup.objects.filter(
        category_id__in=ancestor_ids
    ).select_related('attribute_group').order_by('attribute_group__name')

    result = []
    seen = set()
    for cag in cags:
        ag = cag.attribute_group
        if ag.id in seen:
            continue
        seen.add(ag.id)

        attrs = list(
            ag.attributes.all().order_by('name').values('id', 'name')
        )
        result.append({
            'id': ag.id,
            'name': ag.name,
            'data_type': ag.data_type,
            'required': cag.required,
            'attributes': attrs,
        })

    return Response(result)


@api_view(['GET'])
def ai_usage_stats(request):
    """AI usage statistics"""
    from apps.marketplaces.models import AIUsageLog

    stats = AIUsageLog.objects.aggregate(
        total_cost=Sum('cost_usd'),
        total_calls=Count('id'),
        total_input=Sum('input_tokens'),
        total_output=Sum('output_tokens'),
    )

    by_action = list(AIUsageLog.objects.values('action').annotate(
        cost=Sum('cost_usd'),
        calls=Count('id'),
    ).order_by('-cost'))

    return Response({
        'total_cost_usd': round(stats['total_cost'] or 0, 4),
        'total_calls': stats['total_calls'] or 0,
        'total_input_tokens': stats['total_input'] or 0,
        'total_output_tokens': stats['total_output'] or 0,
        'by_action': by_action,
    })
