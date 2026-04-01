from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.db.models import Prefetch
from .models import Profile, BucketAvatarImage, BucketBannerImage, BucketPersonalImage
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def _ctx(request):
    return {'request': request}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
    return Response(
        {'user': UserSerializer(user).data, **_tokens_for_user(user)},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get('email') or '').lower()
    password = request.data.get('password') or ''

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({'user': UserSerializer(user).data, **_tokens_for_user(user)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profiles_list(request):
    profiles = Profile.objects.select_related('user', 'active_avatar', 'active_banner').prefetch_related('avatar_images', 'banner_images').all()
    return Response(ProfileSerializer(profiles, many=True, context=_ctx(request)).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_detail(request, pk):
    try:
        profile = Profile.objects.select_related('active_avatar', 'active_banner').prefetch_related('avatar_images', 'banner_images').get(pk=pk)
    except Profile.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ProfileSerializer(profile, context=_ctx(request)).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(ProfileSerializer(profile, context=_ctx(request)).data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True, context=_ctx(request))
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data)


def _avatar_list(profile, request):
    return [
        {
            'id': img.id,
            'url': request.build_absolute_uri(img.file.url),
            'active': profile.active_avatar_id == img.id,
        }
        for img in profile.avatar_images.all().order_by('-uploaded_at')
    ]


def _banner_list(profile, request):
    return [
        {
            'id': img.id,
            'url': request.build_absolute_uri(img.file.url),
            'active': profile.active_banner_id == img.id,
        }
        for img in profile.banner_images.all().order_by('-uploaded_at')
    ]


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_avatar(request):
    """GET: list all avatar images. POST: upload new (field: 'avatar')."""
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(_avatar_list(profile, request))

    file = request.FILES.get('avatar')
    if not file:
        return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    img = BucketAvatarImage.objects.create(profile=profile, file=file)
    profile.active_avatar = img
    profile.save(update_fields=['active_avatar'])
    profile.refresh_from_db()
    return Response(_avatar_list(profile, request))


@api_view(['DELETE', 'POST'])
@permission_classes([IsAuthenticated])
def my_avatar_detail(request, pk):
    """DELETE: remove avatar image. POST (activate): set as active avatar."""
    profile, _ = Profile.objects.get_or_create(user=request.user)
    try:
        img = BucketAvatarImage.objects.get(pk=pk, profile=profile)
    except BucketAvatarImage.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if profile.active_avatar_id == img.id:
            profile.active_avatar = None
            profile.save(update_fields=['active_avatar'])
        img.file.delete(save=False)
        img.delete()
    else:  # POST = activate
        profile.active_avatar = img
        profile.save(update_fields=['active_avatar'])

    profile.refresh_from_db()
    return Response(_avatar_list(profile, request))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_banner(request):
    """GET: list all banner images. POST: upload new (field: 'banner')."""
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(_banner_list(profile, request))

    file = request.FILES.get('banner')
    if not file:
        return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    img = BucketBannerImage.objects.create(profile=profile, file=file)
    profile.active_banner = img
    profile.save(update_fields=['active_banner'])
    profile.refresh_from_db()
    return Response(_banner_list(profile, request))


@api_view(['DELETE', 'POST'])
@permission_classes([IsAuthenticated])
def my_banner_detail(request, pk):
    """DELETE: remove banner image. POST (activate): set as active banner."""
    profile, _ = Profile.objects.get_or_create(user=request.user)
    try:
        img = BucketBannerImage.objects.get(pk=pk, profile=profile)
    except BucketBannerImage.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if profile.active_banner_id == img.id:
            profile.active_banner = None
            profile.save(update_fields=['active_banner'])
        img.file.delete(save=False)
        img.delete()
    else:  # POST = activate
        profile.active_banner = img
        profile.save(update_fields=['active_banner'])

    profile.refresh_from_db()
    return Response(_banner_list(profile, request))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_personal_image(request):
    """GET: list personal photos. POST: upload one (field: 'image')."""
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        imgs = profile.personal_images.all().order_by('-uploaded_at')
        return Response([
            {'id': img.id, 'url': request.build_absolute_uri(img.file.url)}
            for img in imgs
        ])

    file = request.FILES.get('image')
    if not file:
        return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
    img = BucketPersonalImage.objects.create(profile=profile, file=file)
    return Response({'id': img.id, 'url': request.build_absolute_uri(img.file.url)},
                    status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def my_personal_image_detail(request, pk):
    """DELETE a personal image."""
    profile, _ = Profile.objects.get_or_create(user=request.user)
    try:
        img = BucketPersonalImage.objects.get(pk=pk, profile=profile)
    except BucketPersonalImage.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    img.file.delete(save=False)
    img.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
