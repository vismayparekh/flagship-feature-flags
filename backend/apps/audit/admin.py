from django.contrib import admin
from apps.audit.models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "org", "actor", "action", "created_at")
    search_fields = ("action",)
    list_filter = ("action",)
