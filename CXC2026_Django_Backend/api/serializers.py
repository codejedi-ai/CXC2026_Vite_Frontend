from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile


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

    class Meta:
        model = Profile
        fields = [
            'id', 'user_id', 'display_name', 'age', 'gender', 'bio',
            'avatar_url', 'avatar_x', 'avatar_y', 'location', 'looking_for', 'interests',
            'compatibility_score', 'online_status', 'type',
        ]
        read_only_fields = ['id', 'user_id', 'compatibility_score', 'type', 'avatar_url']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url
