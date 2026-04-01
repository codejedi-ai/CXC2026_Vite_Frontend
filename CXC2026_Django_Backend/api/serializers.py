from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, BucketAvatarImage, BucketBannerImage, BucketPersonalImage


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
        )
        Profile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']


class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'user_id', 'uuid', 'display_name', 'age', 'gender', 'bio',
            'avatar_url', 'avatar_x', 'avatar_y',
            'banner_url', 'banner_x', 'banner_y',
            'location', 'looking_for', 'interests',
            'compatibility_score', 'online_status', 'type',
        ]
        read_only_fields = ['id', 'user_id', 'uuid', 'compatibility_score', 'type', 'avatar_url', 'banner_url']

    def _abs_url(self, request, file_field):
        if not file_field:
            return None
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_avatar_url(self, obj):
        img = obj.active_avatar
        return self._abs_url(self.context.get('request'), img.file if img else None)

    def get_banner_url(self, obj):
        img = obj.active_banner
        return self._abs_url(self.context.get('request'), img.file if img else None)
