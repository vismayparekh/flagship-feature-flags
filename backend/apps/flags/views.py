from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from apps.flags.models import FeatureFlag, FlagState, FlagRule
from apps.flags.serializers import (
    FeatureFlagSerializer,
    FlagStateSerializer,
    FlagRuleSerializer,
    FlagStateUpdateSerializer,
)
from apps.core.models import Environment
from apps.core.permissions import HasMinRole
from apps.flags.eval import stable_percent, rule_matches
from apps.audit.services import audit


class FeatureFlagViewSet(viewsets.ModelViewSet):
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "developer"

    def get_queryset(self):
        user = self.request.user
        qs = FeatureFlag.objects.select_related("project", "project__org")
        if not user.is_superuser:
            qs = qs.filter(project__org__memberships__user=user).distinct()
        project_id = self.request.query_params.get("project_id")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        obj = serializer.save()
        audit(self.request.user, obj.project.org, "flag.create", {"flag": obj.key, "project": obj.project.key})
        for env in obj.project.environments.all():
            FlagState.objects.get_or_create(
                flag=obj,
                environment=env,
                defaults={
                    "enabled": False,
                    "on_variation": {"value": True},
                    "off_variation": {"value": False},
                    "default_variation": {"value": False},
                },
            )

    # ✅ NEW: Audit on DELETE (Flag)
    def perform_destroy(self, instance):
        org = instance.project.org
        audit(
            self.request.user,
            org,
            "flag.delete",
            {
                "flag": instance.key,
                "project": instance.project.key,
                "flag_id": instance.id,
            },
        )
        instance.delete()


class FlagStateViewSet(viewsets.ModelViewSet):
    serializer_class = FlagStateSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "developer"

    def get_queryset(self):
        user = self.request.user
        qs = FlagState.objects.select_related(
            "flag", "environment", "environment__project", "environment__project__org"
        ).prefetch_related("rules")
        if not user.is_superuser:
            qs = qs.filter(environment__project__org__memberships__user=user).distinct()

        env_id = self.request.query_params.get("environment_id")
        if env_id:
            qs = qs.filter(environment_id=env_id)

        flag_id = self.request.query_params.get("flag_id")
        if flag_id:
            qs = qs.filter(flag_id=flag_id)

        return qs.order_by("-updated_at")

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return FlagStateUpdateSerializer
        return FlagStateSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = FlagStateUpdateSerializer(
            instance,
            data=request.data,
            partial=True,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        instance.refresh_from_db()
        return Response(FlagStateSerializer(instance).data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = FlagStateUpdateSerializer(
            instance,
            data=request.data,
            partial=False,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        instance.refresh_from_db()
        return Response(FlagStateSerializer(instance).data)

    def perform_update(self, serializer):
        obj = serializer.save()
        audit(
            self.request.user,
            obj.environment.project.org,
            "flagstate.update",
            {
                "flag": obj.flag.key,
                "env": obj.environment.key,
                "enabled": obj.enabled,
                "rollout_percentage": obj.rollout_percentage,
            },
        )

    @action(detail=True, methods=["POST"])
    def toggle(self, request, pk=None):
        obj = self.get_object()
        obj.enabled = not obj.enabled
        obj.save()
        audit(
            self.request.user,
            obj.environment.project.org,
            "flagstate.toggle",
            {"flag": obj.flag.key, "env": obj.environment.key, "enabled": obj.enabled},
        )
        return Response(FlagStateSerializer(obj).data)


class FlagRuleViewSet(viewsets.ModelViewSet):
    serializer_class = FlagRuleSerializer
    permission_classes = [IsAuthenticated, HasMinRole]
    min_role = "developer"

    def get_queryset(self):
        user = self.request.user
        qs = FlagRule.objects.select_related(
            "state",
            "state__environment",
            "state__environment__project",
            "state__environment__project__org",
            "state__flag",
        )
        if not user.is_superuser:
            qs = qs.filter(state__environment__project__org__memberships__user=user).distinct()
        state_id = self.request.query_params.get("state_id")
        if state_id:
            qs = qs.filter(state_id=state_id)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save()
        org = obj.state.environment.project.org
        audit(
            self.request.user,
            org,
            "rule.create",
            {
                "flag": obj.state.flag.key,
                "env": obj.state.environment.key,
                "rule_id": obj.id,
                "priority": obj.priority,
                "rollout_percentage": obj.rollout_percentage,
            },
        )

    def perform_update(self, serializer):
        obj = serializer.save()
        org = obj.state.environment.project.org
        audit(
            self.request.user,
            org,
            "rule.update",
            {
                "flag": obj.state.flag.key,
                "env": obj.state.environment.key,
                "rule_id": obj.id,
                "priority": obj.priority,
                "rollout_percentage": obj.rollout_percentage,
            },
        )

    # ✅ NEW: Audit on DELETE (Rule)
    def perform_destroy(self, instance):
        org = instance.state.environment.project.org
        audit(
            self.request.user,
            org,
            "rule.delete",
            {
                "flag": instance.state.flag.key,
                "env": instance.state.environment.key,
                "rule_id": instance.id,
                "priority": instance.priority,
                "rollout_percentage": instance.rollout_percentage,
            },
        )
        instance.delete()


@api_view(["POST"])
@permission_classes([AllowAny])
def sdk_evaluate(request):
    client_key = request.headers.get("X-Client-Key") or request.query_params.get("client_key")
    if not client_key:
        return Response({"detail": "Missing X-Client-Key"}, status=status.HTTP_401_UNAUTHORIZED)

    env = Environment.objects.filter(client_sdk_key=client_key).select_related("project").first()
    if not env:
        return Response({"detail": "Invalid client key"}, status=status.HTTP_401_UNAUTHORIZED)

    user = (request.data or {}).get("user") or {}
    user_key = str(user.get("key") or "")
    if not user_key:
        return Response({"detail": "user.key is required"}, status=status.HTTP_400_BAD_REQUEST)

    states = FlagState.objects.filter(environment=env).select_related("flag").prefetch_related("rules")
    out = {}

    for st in states:
        flag_key = st.flag.key

        if not st.enabled:
            out[flag_key] = {
                "value": st.off_variation.get("value"),
                "reason": "off",
                "variation": {"on": st.on_variation.get("value"), "off": st.off_variation.get("value")},
            }
            continue

        if st.rollout_percentage < 100:
            pct = stable_percent(user_key, flag_key)
            if pct >= st.rollout_percentage:
                out[flag_key] = {
                    "value": st.off_variation.get("value"),
                    "reason": "rollout_excluded",
                    "variation": {"on": st.on_variation.get("value"), "off": st.off_variation.get("value")},
                }
                continue

        matched = False
        for rule in st.rules.all().order_by("priority", "id"):
            if rule_matches(user, rule.clauses):
                if rule.rollout_percentage < 100:
                    pct = stable_percent(user_key, f"{flag_key}:rule:{rule.id}")
                    if pct >= rule.rollout_percentage:
                        continue
                out[flag_key] = {
                    "value": rule.variation.get("value"),
                    "reason": "rule_match",
                    "variation": {"on": st.on_variation.get("value"), "off": st.off_variation.get("value")},
                }
                matched = True
                break

        if not matched:
            out[flag_key] = {
                "value": st.default_variation.get("value"),
                "reason": "default",
                "variation": {"on": st.on_variation.get("value"), "off": st.off_variation.get("value")},
            }

    return Response({"environment": env.key, "flags": out})
