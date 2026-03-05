from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema
from . import views

TokenRefreshView = extend_schema(
    tags=['Authentication'],
    summary="Refresh access token",
    description="Exchange a refresh token for a new access token.",
)(TokenRefreshView)

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]