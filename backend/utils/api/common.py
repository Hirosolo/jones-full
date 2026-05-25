# path: utils/api/common.py
# Description: Định nghĩa các cấu hình chung cho API.

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from rest_framework import serializers


# Định nghĩa serializer
class SampleAuthSerializer(serializers.Serializer):
    ok = serializers.BooleanField()


class AdminAuthSerializer(serializers.Serializer):
    ok = serializers.BooleanField()
    authenticated = serializers.BooleanField()
    username = serializers.CharField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)
    error = serializers.CharField(required=False)


# Decorator để mô tả schema
@extend_schema(
    responses=SampleAuthSerializer,
    summary="API mẫu cho việc xác thực",
    description="API mẫu cho việc xác thực"
)
@api_view(['GET'])
def sample_auth_view(request):
    """
    API mẫu cho việc xác thực
    """
    return Response({
        'ok': True
    })


@extend_schema(
    responses=AdminAuthSerializer,
    summary="Django admin session auth",
    description="Authenticate with the same Django admin account used at /admin/."
)
@csrf_exempt
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def admin_auth_view(request):
    user = request.user

    if request.method == 'GET':
        authenticated = bool(user and user.is_authenticated and user.is_staff)
        return Response({
            'ok': True,
            'authenticated': authenticated,
            'username': user.get_username() if authenticated else '',
            'is_staff': authenticated,
            'is_superuser': bool(getattr(user, 'is_superuser', False) if authenticated else False),
        })

    if request.method == 'DELETE':
        logout(request)
        return Response({'ok': True, 'authenticated': False})

    username = str(request.data.get('username') or '').strip()
    password = str(request.data.get('password') or '')

    if not username or not password:
        return Response(
            {'ok': False, 'authenticated': False, 'error': 'Username and password are required.'},
            status=400,
        )

    user = authenticate(request, username=username, password=password)
    if not user or not user.is_active or not user.is_staff:
        return Response(
            {'ok': False, 'authenticated': False, 'error': 'Invalid Django admin credentials.'},
            status=400,
        )

    login(request, user)
    return Response({
        'ok': True,
        'authenticated': True,
        'username': user.get_username(),
        'is_staff': True,
        'is_superuser': bool(user.is_superuser),
    })


class OpenGraphSerializer(serializers.Serializer):
    """
    Serializer cho dữ liệu Open Graph
    """
    title = serializers.CharField()
    description = serializers.CharField()
    images = serializers.ListField(child=serializers.CharField())
    url = serializers.CharField()


class ItemsListPagination(PageNumberPagination):
    """
    Phân trang cho danh sách items
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response(
            {
                'total': self.page.paginator.count,
                'current': self.page.number,
                'num_pages': self.page.paginator.num_pages,
                'items': data,
            }
        )

