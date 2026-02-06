from django.db import models
from django.conf import settings
from apps.core.models import Organization

class AuditLog(models.Model):
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="audit_logs", null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} ({self.created_at})"
