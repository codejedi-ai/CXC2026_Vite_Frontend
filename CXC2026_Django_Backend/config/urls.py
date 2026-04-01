from django.conf import settings
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path('api/', include('api.urls')),
]

# Always serve media locally; Heroku uses external storage in production.
if not settings.IS_HEROKU_APP:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
