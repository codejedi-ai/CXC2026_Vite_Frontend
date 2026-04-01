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
    path('profiles/me/avatar/<int:pk>/', views.my_avatar_detail, name='my_avatar_detail'),
    path('profiles/me/banner/', views.my_banner, name='my_banner'),
    path('profiles/me/banner/<int:pk>/', views.my_banner_detail, name='my_banner_detail'),
    path('profiles/me/images/', views.my_personal_image, name='my_personal_image'),
    path('profiles/me/images/<int:pk>/', views.my_personal_image_detail, name='my_personal_image_detail'),
    path('profiles/<int:pk>/', views.profile_detail, name='profile_detail'),
]
