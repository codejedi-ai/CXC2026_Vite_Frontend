from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.me, name='me'),
    path('profiles/', views.profiles_list, name='profiles_list'),
    path('profiles/me/', views.my_profile, name='my_profile'),
    path('profiles/me/avatar/', views.my_avatar, name='my_avatar'),
    path('profiles/<int:pk>/', views.profile_detail, name='profile_detail'),
]
