"""
Admin Article Tag CRUD API views.
"""
import os
from functools import wraps

from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from articles.models import Article, ArticleTag


def admin_api_key_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        admin_key = request.headers.get('X-Admin-Key', '')
        expected_key = getattr(settings, 'ADMIN_API_KEY', None) or os.environ.get('ADMIN_API_KEY', '')
        if not expected_key or admin_key != expected_key:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        return view_func(request, *args, **kwargs)
    return wrapper


def _serialize(tag):
    num_articles = Article.objects.filter(tags=tag, status='published').count()
    return {
        'id': tag.id,
        'name': tag.name,
        'slug': tag.slug,
        'desc': tag.desc or '',
        'order': tag.order,
        'metaTitle': tag.meta_title or '',
        'metaDesc': tag.meta_desc or '',
        'numArticles': num_articles,
    }


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_article_tag_list(request):
    search = request.query_params.get('search', '').strip()
    tags = ArticleTag.objects.all().order_by('order', 'name')
    if search:
        tags = tags.filter(Q(name__icontains=search) | Q(slug__icontains=search))
    return Response({'items': [_serialize(tag) for tag in tags]})


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_article_tag_detail(request, pk):
    try:
        tag = ArticleTag.objects.get(pk=pk)
    except ArticleTag.DoesNotExist:
        return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'tag': _serialize(tag)})


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
@admin_api_key_required
def admin_article_tag_create(request):
    data = request.data
    name = (data.get('name') or '').strip()
    if not name:
        return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

    tag = ArticleTag(
        name=name,
        slug=(data.get('slug') or '').strip(),
        desc=(data.get('desc') or '').strip(),
        desc_safe=(data.get('desc_safe') or data.get('desc') or '').strip(),
        order=int(data.get('order', 0) or 0),
        meta_title=(data.get('metaTitle') or data.get('meta_title') or '')[:60],
        meta_desc=(data.get('metaDesc') or data.get('meta_desc') or '')[:145],
    )
    tag.save()
    return Response({'message': 'Tag created', 'tag': _serialize(tag)}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
@admin_api_key_required
def admin_article_tag_update(request, pk):
    try:
        tag = ArticleTag.objects.get(pk=pk)
    except ArticleTag.DoesNotExist:
        return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    if data.get('name'):
        tag.name = data['name'].strip()
    if 'slug' in data:
        tag.slug = (data.get('slug') or '').strip()
    if 'desc' in data:
        tag.desc = data.get('desc') or ''
        tag.desc_safe = (data.get('desc_safe') or data.get('desc') or '').strip()
    if 'order' in data:
        try:
            tag.order = int(data['order'] or 0)
        except (TypeError, ValueError):
            pass
    if 'metaTitle' in data or 'meta_title' in data:
        tag.meta_title = (data.get('metaTitle') or data.get('meta_title') or '')[:60]
    if 'metaDesc' in data or 'meta_desc' in data:
        tag.meta_desc = (data.get('metaDesc') or data.get('meta_desc') or '')[:145]

    tag.save()
    return Response({'message': 'Tag updated', 'tag': _serialize(tag)})


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_article_tag_delete(request, pk):
    try:
        tag = ArticleTag.objects.get(pk=pk)
    except ArticleTag.DoesNotExist:
        return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)

    name = tag.name
    tag.delete()
    return Response({'message': f'Tag "{name}" deleted'})