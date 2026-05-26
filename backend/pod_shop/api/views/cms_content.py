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
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from pod_shop.models import CMSContent
from utils.models import HomeSlider


DEFAULT_HERO_SLIDES = [
    {
        'title': 'collections',
        'description': 'exclusive premium apparel',
        'buttonText': 'buy yours',
        'image': '/assets/images/acdc-hoodie-banner.webp',
        'link': '/category/clothing',
        'order': 1,
    },
    {
        'title': 'accessories',
        'description': 'new arrivals',
        'buttonText': 'buy yours',
        'image': '/assets/images/starWar-cup-banner.webp',
        'link': '/category/accessories',
        'order': 2,
    },
    {
        'title': 'home decor',
        'description': 'vintage aesthetic',
        'buttonText': 'buy yours',
        'image': '/assets/images/monsterEnergy-cap-banner.webp',
        'link': '/category/home-decor',
        'order': 3,
    },
]


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


def _normalize_hero_slide(slide, fallback_order):
    if not isinstance(slide, dict):
        return None

    title = str(slide.get('title') or '').strip()
    if not title:
        return None

    description = str(
        slide.get('description')
        or slide.get('desc')
        or slide.get('desc_safe')
        or ''
    ).strip()
    button_text = str(
        slide.get('buttonText')
        or slide.get('button_text')
        or ''
    ).strip()
    image = str(slide.get('image') or slide.get('image_url') or '').strip()
    link = str(slide.get('link') or slide.get('url') or '').strip() or '/'

    order_value = slide.get('order', fallback_order)
    try:
        order = int(order_value)
    except (TypeError, ValueError):
        order = fallback_order

    return {
        'title': title,
        'description': description,
        'button_text': button_text or 'SHOP NOW',
        'image': image,
        'link': link,
        'order': order,
    }


def _serialize_home_slider(obj, include_id=False):
    image_name = getattr(obj.image, 'name', '') or ''
    image_url = image_name
    if not image_url and obj.image and hasattr(obj.image, 'url'):
        image_url = obj.image.url

    slide = {
        'title': obj.title,
        'description': obj.desc_safe or obj.desc or '',
        'buttonText': obj.button_text or '',
        'image': image_url,
        'link': obj.link or '',
        'order': obj.order,
        'status': obj.status,
    }
    if include_id:
        slide['id'] = obj.id
    return slide


def _get_hero_sliders_queryset(include_inactive=False):
    queryset = HomeSlider.objects.all()
    if not include_inactive:
        queryset = queryset.filter(status=True)
    return queryset.order_by('order', 'id')


def _hero_slide_request_payload(data):
    if isinstance(data, dict) and isinstance(data.get('slide'), dict):
        return data['slide']
    if isinstance(data, dict):
        return data
    return {}


def _sync_home_slider_rows(slides):
    normalized = []
    for index, slide in enumerate(slides or [], start=1):
        item = _normalize_hero_slide(slide, index)
        if item:
            normalized.append(item)

    HomeSlider.objects.all().delete()
    for item in normalized:
        HomeSlider.objects.create(
            title=item['title'],
            desc=item['description'],
            desc_safe=item['description'],
            image=item['image'],
            link=item['link'],
            button_text=item['button_text'],
            order=item['order'],
            status=True,
        )


def _resolve_home_hero(payload):
    sliders = list(_get_hero_sliders_queryset(include_inactive=True))
    if sliders:
        return {
            'enabled': True,
            'order': 1,
            'defaultSlides': [_serialize_home_slider(slider) for slider in sliders],
        }

    hero_payload = None
    if isinstance(payload, dict):
        home = payload.get('home') if isinstance(payload.get('home'), dict) else {}
        hero_candidate = home.get('hero') if isinstance(home, dict) else {}
        if isinstance(hero_candidate, dict) and 'defaultSlides' in hero_candidate:
            hero_payload = hero_candidate

    if isinstance(hero_payload, dict):
        normalized_slides = []
        for index, slide in enumerate(hero_payload.get('defaultSlides') or [], start=1):
            item = _normalize_hero_slide(slide, index)
            if item:
                normalized_slides.append({
                    'title': item['title'],
                    'description': item['description'],
                    'buttonText': item['button_text'],
                    'image': item['image'],
                    'link': item['link'],
                    'order': item['order'],
                })

        if normalized_slides:
            return {
                'enabled': hero_payload.get('enabled', True),
                'order': hero_payload.get('order', 1),
                'defaultSlides': normalized_slides,
            }

    return {
        'enabled': True,
        'order': 1,
        'defaultSlides': [],
    }


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@admin_api_key_required
def hero_slider_list_view(request):
    if request.method == 'GET':
        sliders = list(_get_hero_sliders_queryset())
        return Response({
            'total': len(sliders),
            'items': [_serialize_home_slider(slider, include_id=True) for slider in sliders],
        })

    payload = _hero_slide_request_payload(request.data)
    item = _normalize_hero_slide(payload, HomeSlider.objects.count() + 1)
    if not item:
        return Response({'error': 'Invalid hero slide payload.'}, status=status.HTTP_400_BAD_REQUEST)

    slider = HomeSlider.objects.create(
        title=item['title'],
        desc=item['description'],
        desc_safe=item['description'],
        image=item['image'] or '/img/hero-banner-default.png',
        link=item['link'],
        button_text=item['button_text'],
        order=item['order'],
        status=bool(payload.get('status', True)),
    )

    return Response(
        {'success': True, 'item': _serialize_home_slider(slider, include_id=True)},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PATCH', 'POST', 'DELETE'])
@permission_classes([AllowAny])
@admin_api_key_required
def hero_slider_detail_view(request, slide_id):
    slider = get_object_or_404(HomeSlider, pk=slide_id)

    if request.method == 'GET':
        return Response({'item': _serialize_home_slider(slider, include_id=True)})

    if request.method == 'DELETE':
        slider.delete()
        return Response({'success': True})

    payload = _hero_slide_request_payload(request.data)
    item = _normalize_hero_slide(payload, slider.order or 1)
    if not item:
        return Response({'error': 'Invalid hero slide payload.'}, status=status.HTTP_400_BAD_REQUEST)

    slider.title = item['title']
    slider.desc = item['description']
    slider.desc_safe = item['description']
    slider.image = item['image'] or '/img/hero-banner-default.png'
    slider.link = item['link']
    slider.button_text = item['button_text']
    slider.order = item['order']
    slider.status = bool(payload.get('status', slider.status))
    slider.save()

    return Response({'success': True, 'item': _serialize_home_slider(slider, include_id=True)})


@api_view(['GET'])
@permission_classes([AllowAny])
def cms_content_get_view(request):
    """Read the singleton CMS payload. Empty dict if never written."""
    obj = CMSContent.get_solo()
    payload = obj.payload or {}
    if not isinstance(payload, dict):
        payload = {}

    home = payload.get('home') if isinstance(payload.get('home'), dict) else {}
    home = {**home, 'hero': _resolve_home_hero(payload)}
    payload = {**payload, 'home': home}
    return Response(payload)


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

    hero = payload.get('home', {}).get('hero', {}) if isinstance(payload.get('home'), dict) else {}
    if isinstance(hero, dict) and 'defaultSlides' in hero:
        _sync_home_slider_rows(hero.get('defaultSlides', []))

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
    if segments == ['hero']:
        return Response({'section': 'hero', 'value': _resolve_home_hero(payload)})
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

    if segments == ['hero'] and isinstance(value, dict) and 'defaultSlides' in value:
        _sync_home_slider_rows(value.get('defaultSlides', []))

    obj.payload = payload
    obj.save()
    return Response({
        'success': True,
        'section': '/'.join(segments),
        'updated_at': obj.updated_at.isoformat(),
    })
