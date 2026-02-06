from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.accounts.serializers import RegisterSerializer, UserSerializer
from apps.core.services import bootstrap_org_for_new_user

User = get_user_model()

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        bootstrap_org_for_new_user(user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class MeAPIView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
