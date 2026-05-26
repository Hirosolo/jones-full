"""
Admin Category CRUD API views.
Secured by X-Admin-Key header authentication.
"""
import os
from functools import wraps
from urllib.parse import urlparse

from django.conf import settings
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from pod_shop.models import Category, Product


def admin_api_key_required(view_func):
    """Decorator to require X-Admin-Key header for admin API endpoints."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        admin_key = request.headers.get('X-Admin-Key', '')
        expected_key = getattr(settings, 'ADMIN_API_KEY', None) or os.environ.get('ADMIN_API_KEY', '')
        if not expected_key or admin_key != expected_key:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        return view_func(request, *args, **kwargs)
    return wrapper


def _public_url(request, value):
    value = (value or '').strip()
    if not value:
        return ''
    if value.startswith(('http://', 'https://', 'data:', '//')):
        parsed = urlparse(value)
        if parsed.scheme in ('http', 'https') and parsed.path:
            path = parsed.path
            if path.startswith('/media/'):
                return _frontend_media_url(path)
        return value
    if not value.startswith('/'):
        value = '/' + value
    if value.startswith('/media/'):
        return _frontend_media_url(value)
    return request.build_absolute_uri(value)


def _frontend_media_url(media_path: str) -> str:
    media_path = (media_path or '').strip()
    if not media_path:
        return ''
    if media_path.startswith('/media/'):
        media_path = media_path[len('/media/'):]
    media_path = media_path.lstrip('/')
    site_url = getattr(settings, 'SITE_URL', '') or 'http://localhost:3000/'
    return f"{site_url.rstrip('/')}/api/media/{media_path}"


def _serialize(request, c):
    img_url = ''
    try:
        img_url = _public_url(request, c.image_url)
        if not img_url and c.image:
            img_url = _public_url(request, c.image.url)
    except Exception:
        img_url = ''
    return {
        'id': c.id,
        'name': c.name,
        'slug': c.slug,
        'desc': c.desc or '',
        'order': c.order,
        'image': img_url or None,
        'numProducts': Product.objects.filter(category=c, status='A').count(),
    }


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_category_list(request):
    """List all categories with active-product counts."""
    cats = Category.objects.all().order_by('order', 'name')
    items = [_serialize(request, c) for c in cats]
    return Response({'total': len(items), 'items': items})


@api_view(['GET'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_category_detail(request, pk):
    """Get detail information for one category."""
    try:
        cat = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'category': _serialize(request, cat)})


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@admin_api_key_required
def admin_category_create(request):
    """Create a new category."""
    data = request.data
    name = (data.get('name') or '').strip()
    if not name:
        return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

    if Category.objects.filter(name__iexact=name).exists():
        return Response({'error': f'Category "{name}" already exists'}, status=status.HTTP_400_BAD_REQUEST)

    cat = Category(
        name=name,
        desc=data.get('desc', '') or '',
        image_url=_public_url(request, data.get('image_url')),
        order=int(data.get('order', 1) or 1),
    )

    image = request.FILES.get('image')
    if image:
        cat.image = image

    cat.save()
    if image:
        cat.image_url = _frontend_media_url(cat.image.url)
        cat.save(update_fields=['image_url'])

    payload = _serialize(request, cat)
    payload['message'] = f'Category "{cat.name}" created successfully'
    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@admin_api_key_required
def admin_category_update(request, pk):
    """Update an existing category."""
    try:
        cat = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data

    if data.get('name'):
        new_name = data['name'].strip()
        if Category.objects.filter(name__iexact=new_name).exclude(pk=pk).exists():
            return Response({'error': f'Category "{new_name}" already exists'}, status=status.HTTP_400_BAD_REQUEST)
        cat.name = new_name

    if 'desc' in data:
        cat.desc = data['desc'] or ''

    if 'image_url' in data:
        cat.image_url = _public_url(request, data.get('image_url'))

    image = request.FILES.get('image')
    if image:
        cat.image = image

    if 'order' in data and data['order'] != '':
        cat.order = int(data['order'])

    cat.save()
    if image:
        cat.image_url = _frontend_media_url(cat.image.url)
        cat.save(update_fields=['image_url'])

    payload = _serialize(request, cat)
    payload['message'] = f'Category "{cat.name}" updated successfully'
    return Response(payload)


@api_view(['DELETE'])
@permission_classes([AllowAny])
@admin_api_key_required
def admin_category_delete(request, pk):
    """Delete a category. Prevents deletion if products are linked."""
    try:
        cat = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    product_count = Product.objects.filter(category=cat).count()
    if product_count > 0:
        return Response({
            'error': f'Cannot delete "{cat.name}" — {product_count} product(s) still use this category. '
                     f'Reassign or delete those products first.',
        }, status=status.HTTP_400_BAD_REQUEST)

    name = cat.name
    cat.delete()
    return Response({'message': f'Category "{name}" deleted successfully'})
