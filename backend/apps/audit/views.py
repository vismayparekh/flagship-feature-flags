from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.all()
        if not user.is_superuser:
            qs = qs.filter(org__memberships__user=user).distinct()
        org_id = self.request.query_params.get("org_id")
        if org_id:
            qs = qs.filter(org_id=org_id)
        return qs
