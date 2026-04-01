# UW-Crushes — Django Backend

Pure REST API backend. Handles authentication, user profiles, and the database.

## Stack

- Django 5.1 + Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- SQLite (dev) / PostgreSQL (prod)
- `uv` for dependency management

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | — | Create account |
| POST | `/api/auth/login/` | — | Get JWT tokens |
| POST | `/api/auth/refresh/` | — | Refresh access token |
| GET | `/api/auth/me/` | JWT | Current user |
| GET | `/api/profiles/` | JWT | All profiles |
| GET/PUT | `/api/profiles/me/` | JWT | Your profile |
| GET | `/api/profiles/<id>/` | JWT | Single profile |

## Run

```bash
uv run --with-requirements requirements.txt python manage.py migrate
uv run --with-requirements requirements.txt python manage.py runserver
```

## Structure

```
config/         # Django project settings, urls, wsgi, asgi
api/            # App — models, views, serializers, urls, migrations
manage.py
requirements.txt
```
