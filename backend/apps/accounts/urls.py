from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.accounts.views import RegisterAPIView, MeAPIView

urlpatterns = [
    path("register/", RegisterAPIView.as_view()),
    path("token/", TokenObtainPairView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("me/", MeAPIView.as_view()),
]
