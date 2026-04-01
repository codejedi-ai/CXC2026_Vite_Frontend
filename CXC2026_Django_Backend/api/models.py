import os
import uuid as uuid_lib

from django.db import models
from django.contrib.auth.models import User


def _prefix(profile) -> str:
    return 'BOT' if profile.type == 'ai' else 'HUMAN'


def _avatar_path(instance, filename):
    p = instance.profile
    ext = os.path.splitext(filename)[1].lower()
    return f"img_avatars/{_prefix(p)}_{p.uuid}{ext}"


def _banner_path(instance, filename):
    p = instance.profile
    ext = os.path.splitext(filename)[1].lower()
    return f"img_banners/{_prefix(p)}_{p.uuid}{ext}"


def _personal_path(instance, filename):
    p = instance.profile
    ext = os.path.splitext(filename)[1].lower()
    return f"img_personal/{_prefix(p)}_{p.uuid}{ext}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    uuid = models.UUIDField(default=uuid_lib.uuid4, editable=False, unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    age = models.IntegerField(default=20)
    gender = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    # Active images — point to the chosen image from each bucket table
    active_avatar = models.ForeignKey(
        'BucketAvatarImage', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+'
    )
    avatar_x = models.FloatField(default=50.0)
    avatar_y = models.FloatField(default=50.0)
    active_banner = models.ForeignKey(
        'BucketBannerImage', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+'
    )
    banner_x = models.FloatField(default=50.0)
    banner_y = models.FloatField(default=50.0)
    location = models.CharField(max_length=100, blank=True)
    looking_for = models.CharField(max_length=100, blank=True)
    interests = models.JSONField(default=list)
    compatibility_score = models.FloatField(default=0)
    online_status = models.BooleanField(default=True)
    type = models.CharField(
        max_length=10,
        default='human',
        choices=[('human', 'Human'), ('ai', 'AI')],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name or self.user.email}"


# ── Bucket image tables ───────────────────────────────────────────────────────
# One row per uploaded file. Profile → many images (one-to-many per bucket).

class BucketAvatarImage(models.Model):
    """img_avatars bucket — profile pictures."""
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='avatar_images')
    file = models.ImageField(upload_to=_avatar_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class BucketBannerImage(models.Model):
    """img_banners bucket — profile banner/hero images."""
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='banner_images')
    file = models.ImageField(upload_to=_banner_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class BucketPersonalImage(models.Model):
    """img_personal bucket — additional personal photos."""
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='personal_images')
    file = models.ImageField(upload_to=_personal_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
