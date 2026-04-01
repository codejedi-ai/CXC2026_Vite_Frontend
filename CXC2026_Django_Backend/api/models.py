import os

from django.db import models
from django.contrib.auth.models import User


def _avatar_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    stem = os.path.splitext(filename)[0]
    return f"img_avatars/{instance.user_id}_{stem}{ext}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=100, blank=True)
    age = models.IntegerField(default=20)
    gender = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to=_avatar_path, blank=True)
    avatar_x = models.FloatField(default=50.0)
    avatar_y = models.FloatField(default=50.0)
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
