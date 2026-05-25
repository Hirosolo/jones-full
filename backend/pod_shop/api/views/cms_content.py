"""
CMS site-content singleton API.

GET  /api/shop/cms/site-content/        — public read (whatever's in the DB
                                          gets rendered on the public site
                                          anyway, so no auth needed).
POST /api/shop/cms/site-content/save/   — admin write, X-Admin-Key required.
"""
import os
from functools import wraps

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from pod_shop.models import CMSContent


def admin_api_key_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        admin_key = request.headers.get('X-Admin-Key', '')
        expected_key = (
            getattr(settings, 'ADMIN_API_KEY', None)
            or os.environ.get('ADMIN_API_KEY', '')
        )
        if not expected_key or admin_key != expected_key:
            return Response(
                {'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED
            )
        return view_func(request, *args, **kwargs)
    return wrapper


@api_view(['GET'])
@permission_classes([AllowAny])
def cms_content_get_view(request):
    """Read the singleton CMS payload. Empty dict if never written."""
    obj = CMSContent.get_solo()
    return Response(obj.payload or {})


@api_view(['POST'])
@permission_classes([AllowAny])
@admin_api_key_required
def cms_content_set_view(request):
    """Replace the singleton CMS payload."""
    payload = request.data
    if not isinstance(payload, dict):
        return Response(
            {'error': 'Expected a JSON object as request body.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    obj = CMSContent.get_solo()
    obj.payload = payload
    obj.save()
    return Response({'success': True, 'updated_at': obj.updated_at.isoformat()})


def _parse_section_path(section_path):
    segments = [segment.strip() for segment in str(section_path or '').split('/') if segment.strip()]
    allowed = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-')
    for segment in segments:
        if any(char not in allowed for char in segment):
            return None
    return segments


def _read_nested(data, segments):
    current = data
    for segment in segments:
        if not isinstance(current, dict) or segment not in current:
            return False, None
        current = current[segment]
    return True, current


def _write_nested(data, segments, value):
    current = data
    for segment in segments[:-1]:
        next_value = current.get(segment)
        if not isinstance(next_value, dict):
            next_value = {}
            current[segment] = next_value
        current = next_value
    current[segments[-1]] = value


@api_view(['GET'])
@permission_classes([AllowAny])
def cms_content_section_get_view(request, section_path):
    """Read one CMS section, e.g. hero or nested blocks like footer/links."""
    segments = _parse_section_path(section_path)
    if not segments:
        return Response({'error': 'Invalid section path.'}, status=status.HTTP_400_BAD_REQUEST)

    obj = CMSContent.get_solo()
    payload = obj.payload or {}
    found, value = _read_nested(payload, segments)
    if not found:
        return Response({'error': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'section': '/'.join(segments), 'value': value})


@api_view(['PATCH', 'POST'])
@permission_classes([AllowAny])
@admin_api_key_required
def cms_content_section_set_view(request, section_path):
    """Update one CMS section without replacing the entire payload."""
    segments = _parse_section_path(section_path)
    if not segments:
        return Response({'error': 'Invalid section path.'}, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(request.data, dict) and 'value' in request.data:
        value = request.data['value']
    else:
        value = request.data

    obj = CMSContent.get_solo()
    payload = obj.payload or {}
    if not isinstance(payload, dict):
        payload = {}

    _write_nested(payload, segments, value)

    obj.payload = payload
    obj.save()
    return Response({
        'success': True,
        'section': '/'.join(segments),
        'updated_at': obj.updated_at.isoformat(),
    })
