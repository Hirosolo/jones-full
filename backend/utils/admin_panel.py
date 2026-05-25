import os
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.test import Client
from django.utils.text import slugify
from django.views.decorators.http import require_POST

from pod_shop.models import Brand, Category, Product, ProductImage, Tag


def _fetch_admin_products(request, search='', status_filter=''):
    api_key = getattr(settings, 'ADMIN_API_KEY', '') or os.environ.get('ADMIN_API_KEY', '')
    client = Client(HTTP_USER_AGENT='Mozilla/5.0')
    page = 1
    page_size = 200
    products = []
    total = 0
    num_pages = 1
    error_message = ''

    while page <= num_pages:
        params = [f'page={page}', f'page_size={page_size}']
        if search:
            params.append(f'search={search}')
        if status_filter:
            params.append(f'status={status_filter}')

        response = client.get(
            '/api/shop/admin-products/',
            data=dict(param.split('=', 1) for param in params),
            HTTP_X_ADMIN_KEY=api_key,
        )

        if response.status_code != 200:
            error_message = f'Product API returned HTTP {response.status_code}.'
            break

        payload = response.json()

        if page == 1:
            total = int(payload.get('total', 0) or 0)
            num_pages = int(payload.get('numPages', 1) or 1)

        products.extend(payload.get('items', []))
        page += 1

    return products, total, error_message


def _serialized_categories():
    return list(Category.objects.all().order_by('name').values('id', 'name', 'slug'))


def _serialized_brands():
    return list(Brand.objects.all().order_by('name').values('id', 'name', 'slug', 'league'))


def _serialized_tags():
    return list(Tag.objects.all().order_by('name').values('id', 'name', 'slug'))


def _product_form_context():
    return {
        'categories': _serialized_categories(),
        'brands': _serialized_brands(),
        'tags': _serialized_tags(),
        'status_options': [
            {'value': 'D', 'label': 'Draft'},
            {'value': 'A', 'label': 'Active'},
            {'value': 'O', 'label': 'Out of Stock'},
        ],
    }


def _positive_decimal(raw_value, field_name, errors):
    value = (raw_value or '').strip()
    if not value:
        errors[field_name] = 'This field is required.'
        return None

    try:
        parsed = Decimal(value)
    except (InvalidOperation, ValueError):
        errors[field_name] = 'Enter a valid number.'
        return None

    if parsed <= 0:
        errors[field_name] = 'Enter a positive number.'
        return None

    return parsed


def _optional_decimal(raw_value, field_name, errors):
    value = (raw_value or '').strip()
    if not value:
        return None

    try:
        parsed = Decimal(value)
    except (InvalidOperation, ValueError):
        errors[field_name] = 'Enter a valid number.'
        return None

    if parsed <= 0:
        errors[field_name] = 'Enter a positive number.'
        return None

    return parsed


def _collect_form_list(request, name):
    values = request.POST.getlist(name)
    if not values:
        values = request.POST.getlist(f'{name}[]')
    return [value for value in values if value not in ('', None)]


def _build_product_payload(request):
    errors = {}

    name = (request.POST.get('name') or '').strip()
    slug_value = (request.POST.get('slug') or '').strip()
    price = _positive_decimal(request.POST.get('price'), 'price', errors)
    compare_at_price = _optional_decimal(request.POST.get('compare_at_price'), 'compare_at_price', errors)

    category_id = (request.POST.get('category_id') or '').strip()
    brand_id = (request.POST.get('brand_id') or '').strip()

    if not name:
        errors['name'] = 'Product name is required.'
    if not category_id:
        errors['category_id'] = 'Category is required.'
    if not brand_id:
        errors['brand_id'] = 'Brand is required.'

    category = None
    brand = None
    if category_id:
        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            errors['category_id'] = 'Select a valid category.'
    if brand_id:
        try:
            brand = Brand.objects.get(pk=brand_id)
        except Brand.DoesNotExist:
            errors['brand_id'] = 'Select a valid brand.'

    status_value = (request.POST.get('status') or 'D').strip() or 'D'
    if status_value not in {'D', 'A', 'O'}:
        errors['status'] = 'Select a valid status.'

    if slug_value:
        slug_value = slugify(slug_value)
        if not slug_value:
            errors['slug'] = 'Enter a valid slug.'
        elif Product.objects.filter(slug=slug_value).exists():
            errors['slug'] = 'Slug must be unique.'

    image_validator = URLValidator(schemes=['http', 'https'])
    image_urls = []
    for raw_url in _collect_form_list(request, 'image_urls'):
        url = raw_url.strip()
        if not url:
            continue
        try:
            image_validator(url)
        except ValidationError:
            errors['image_urls'] = 'Image URLs must be valid http(s) URLs.'
            break
        image_urls.append(url)

    tag_ids = []
    for raw_tag_id in _collect_form_list(request, 'tag_ids'):
        try:
            tag_ids.append(int(raw_tag_id))
        except (TypeError, ValueError):
            errors['tags'] = 'Select valid tags.'
            break

    selected_tags = list(Tag.objects.filter(id__in=tag_ids)) if tag_ids else []

    form_values = {
        'name': name,
        'slug': slug_value,
        'price': request.POST.get('price', '').strip(),
        'compare_at_price': request.POST.get('compare_at_price', '').strip(),
        'category_id': category_id,
        'brand_id': brand_id,
        'status': status_value,
        'desc_short': request.POST.get('desc_short', '').strip(),
        'desc': request.POST.get('desc', '').strip(),
        'meta_title': request.POST.get('meta_title', '').strip(),
        'meta_desc': request.POST.get('meta_desc', '').strip(),
        'is_featured': request.POST.get('is_featured') == 'on',
        'best_seller': request.POST.get('best_seller') == 'on',
        'image_urls': image_urls or [''],
        'selected_tag_ids': tag_ids,
        'selected_tags': selected_tags,
    }

    if errors:
        return None, errors, form_values

    return {
        'name': name,
        'slug': slug_value,
        'price': price,
        'compare_at_price': compare_at_price,
        'category': category,
        'brand': brand,
        'status': status_value,
        'desc_short': form_values['desc_short'],
        'desc': form_values['desc'],
        'meta_title': form_values['meta_title'],
        'meta_desc': form_values['meta_desc'],
        'is_featured': form_values['is_featured'],
        'best_seller': form_values['best_seller'],
        'image_urls': image_urls,
        'selected_tags': selected_tags,
    }, {}, form_values


def _json_response_from_errors(errors, form_values=None, status_code=400):
    payload = {'ok': False, 'errors': errors}
    if form_values is not None:
        payload['formValues'] = form_values
    return JsonResponse(payload, status=status_code)


def _create_product(payload):
    with transaction.atomic():
        product = Product(
            name=payload['name'],
            price=payload['price'],
            fake_price=payload['compare_at_price'],
            category=payload['category'],
            brand=payload['brand'],
            status=payload['status'],
            desc_short=payload['desc_short'],
            desc=payload['desc'],
            meta_title=payload['meta_title'],
            meta_desc=payload['meta_desc'],
            is_featured=payload['is_featured'],
            best_seller=payload['best_seller'],
        )
        if payload['slug']:
            product.slug = payload['slug']
        product.save()

        if payload['selected_tags']:
            product.tags.set(payload['selected_tags'])

        for order, url in enumerate(payload['image_urls']):
            ProductImage.objects.create(product=product, image_url=url, order=order)

    return product


def admin_panel_view(request):
    search = (request.GET.get('search') or '').strip()
    status_filter = (request.GET.get('status') or '').strip()
    success_message = 'Product created successfully.' if request.GET.get('created') == '1' else ''
    if request.GET.get('deleted') == '1':
        success_message = 'Product deleted successfully.'

    products, total_count, error_message = _fetch_admin_products(request, search=search, status_filter=status_filter)

    active_count = sum(1 for item in products if item.get('status') == 'A')
    draft_count = sum(1 for item in products if item.get('status') == 'D')
    low_stock_count = sum(1 for item in products if (item.get('stock') or 0) <= 10)

    return render(request, 'admin_panel.html', {
        'search': search,
        'status_filter': status_filter,
        'products': products,
        'total_count': total_count,
        'active_count': active_count,
        'draft_count': draft_count,
        'low_stock_count': low_stock_count,
        'error_message': error_message,
        'success_message': success_message,
    })


@require_POST
def admin_product_delete_view(request, pk):
    product = Product.objects.filter(pk=pk).first()
    if not product:
        return redirect('/admin/?error=product-not-found')

    name = product.name
    product.delete()
    return redirect('/admin/?deleted=1&name=' + slugify(name))


def admin_product_create_view(request):
    context = _product_form_context()
    form_values = {
        'name': '',
        'slug': '',
        'price': '',
        'compare_at_price': '',
        'category_id': '',
        'brand_id': '',
        'status': 'D',
        'desc_short': '',
        'desc': '',
        'meta_title': '',
        'meta_desc': '',
        'is_featured': False,
        'best_seller': False,
        'image_urls': [''],
        'selected_tag_ids': [],
    }

    if request.method == 'POST':
        payload, errors, posted_values = _build_product_payload(request)
        if errors:
            context.update({
                'form_values': posted_values,
                'field_errors': errors,
            })
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return _json_response_from_errors(errors, posted_values)
            response = render(request, 'admin_product_create.html', context)
            response['X-Frame-Options'] = 'SAMEORIGIN'
            return response

        product = _create_product(payload)
        response_data = {
            'ok': True,
            'message': 'Product created successfully.',
            'redirectUrl': '/admin/?created=1',
            'product': {
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
            },
        }
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(response_data)
        return redirect('/admin/?created=1')

    context.update({
        'form_values': form_values,
        'field_errors': {},
    })
    response = render(request, 'admin_product_create.html', context)
    response['X-Frame-Options'] = 'SAMEORIGIN'
    return response


@require_POST
def admin_category_inline_create_view(request):
    name = (request.POST.get('name') or '').strip()
    if not name:
        return JsonResponse({'ok': False, 'errors': {'name': 'Category name is required.'}}, status=400)
    if Category.objects.filter(name__iexact=name).exists():
        return JsonResponse({'ok': False, 'errors': {'name': 'Category already exists.'}}, status=400)

    category = Category.objects.create(
        name=name,
        desc=(request.POST.get('desc') or '').strip(),
        order=int(request.POST.get('order') or 1),
    )
    return JsonResponse({
        'ok': True,
        'item': {'id': category.id, 'name': category.name, 'slug': category.slug},
        'message': f'Category "{category.name}" created successfully.',
    })


@require_POST
def admin_brand_inline_create_view(request):
    name = (request.POST.get('name') or '').strip()
    if not name:
        return JsonResponse({'ok': False, 'errors': {'name': 'Brand name is required.'}}, status=400)
    if Brand.objects.filter(name__iexact=name).exists():
        return JsonResponse({'ok': False, 'errors': {'name': 'Brand already exists.'}}, status=400)

    brand = Brand.objects.create(
        name=name,
        desc=(request.POST.get('desc') or '').strip(),
        league=(request.POST.get('league') or '').strip(),
        order=int(request.POST.get('order') or 1),
        logo_url=(request.POST.get('logo_url') or '').strip(),
    )
    return JsonResponse({
        'ok': True,
        'item': {'id': brand.id, 'name': brand.name, 'slug': brand.slug},
        'message': f'Brand "{brand.name}" created successfully.',
    })


@require_POST
def admin_tag_inline_create_view(request):
    name = (request.POST.get('name') or '').strip()
    if not name:
        return JsonResponse({'ok': False, 'errors': {'name': 'Tag name is required.'}}, status=400)
    if Tag.objects.filter(name__iexact=name).exists():
        return JsonResponse({'ok': False, 'errors': {'name': 'Tag already exists.'}}, status=400)

    tag = Tag.objects.create(
        name=name,
        desc=(request.POST.get('desc') or '').strip(),
    )
    return JsonResponse({
        'ok': True,
        'item': {'id': tag.id, 'name': tag.name, 'slug': tag.slug},
        'message': f'Tag "{tag.name}" created successfully.',
    })