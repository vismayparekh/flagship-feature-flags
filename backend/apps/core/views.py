from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import Organization, Project, Environment, Membership
from apps.core.serializers import OrganizationSerializer, ProjectSerializer, EnvironmentSerializer, MembershipSerializer
from apps.core.permissions import HasMinRole
from apps.audit.services import audit  # ✅ NEW


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Organization.objects.all().order_by("-created_at")
        return Organization.objects.filter(memberships__user=user).distinct().order_by("-created_at")

    def perform_create(self, serializer):
        org = serializer.save()
        Membership.objects.get_or_create(org=org, user=self.request.user, defaults={"role": "owner"})
        audit(self.request.user, org, "org.create", {"org": org.slug, "org_id": org.id})

    # ✅ NEW: Audit on DELETE (Org)
    def perform_destroy(self, instance):
        audit(self.request.user, instance, "org.delete", {"org": instance.slug, "org_id": instance.id})
        instance.delete()


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "admin"

    def get_queryset(self):
        user = self.request.user
        org_id = self.request.query_params.get("org_id")
        qs = Membership.objects.all()
        if not user.is_superuser:
            qs = qs.filter(org__memberships__user=user).distinct()
        if org_id:
            qs = qs.filter(org_id=org_id)
        return qs.order_by("-created_at")

    # ✅ NEW: Audit on DELETE (Membership)
    def perform_destroy(self, instance):
        org = instance.org
        audit(
            self.request.user,
            org,
            "membership.delete",
            {"org": org.slug, "member_email": getattr(instance.user, "email", ""), "role": instance.role},
        )
        instance.delete()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "developer"

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.all()
        if not user.is_superuser:
            qs = qs.filter(org__memberships__user=user).distinct()
        org_id = self.request.query_params.get("org_id")
        if org_id:
            qs = qs.filter(org_id=org_id)
        return qs.order_by("-created_at")

    # ✅ NEW: Audit on DELETE (Project)
    def perform_destroy(self, instance):
        org = instance.org
        audit(
            self.request.user,
            org,
            "project.delete",
            {"project": instance.key, "project_id": instance.id, "org": org.slug},
        )
        instance.delete()


class EnvironmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnvironmentSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "developer"

    def get_queryset(self):
        user = self.request.user
        qs = Environment.objects.select_related("project", "project__org")
        if not user.is_superuser:
            qs = qs.filter(project__org__memberships__user=user).distinct()
        project_id = self.request.query_params.get("project_id")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by("-created_at")

    # ✅ FIX: enforce admin role for rotate_keys (min_role must be set BEFORE permissions run)
    def get_permissions(self):
        if self.action == "rotate_keys":
            self.min_role = "admin"
        return [p() for p in self.permission_classes]

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated, HasMinRole])
    def rotate_keys(self, request, pk=None):
        env = self.get_object()

        env.client_sdk_key = ""
        env.server_sdk_key = ""
        env.save()

        audit(
            request.user,
            env.project.org,
            "environment.rotate_keys",
            {"project": env.project.key, "env": env.key, "env_id": env.id},
        )

        return Response(EnvironmentSerializer(env).data)

    # ✅ NEW: Audit on DELETE (Environment)
    def perform_destroy(self, instance):
        org = instance.project.org
        audit(
            self.request.user,
            org,
            "environment.delete",
            {"project": instance.project.key, "env": instance.key, "env_id": instance.id},
        )
        instance.delete()
