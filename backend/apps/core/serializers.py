from rest_framework import serializers
from apps.core.models import Organization, Project, Environment, Membership

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "created_at"]

class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "org", "user", "user_email", "user_full_name", "role", "created_at"]
        read_only_fields = ["created_at"]

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "org", "name", "key", "description", "created_at"]
        read_only_fields = ["created_at"]

class EnvironmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Environment
        fields = ["id", "project", "name", "key", "client_sdk_key", "server_sdk_key", "created_at"]
        read_only_fields = ["client_sdk_key", "server_sdk_key", "created_at"]
