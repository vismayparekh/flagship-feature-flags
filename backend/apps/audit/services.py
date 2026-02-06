from apps.audit.models import AuditLog

def audit(actor, org, action, metadata=None):
    metadata = metadata or {}
    AuditLog.objects.create(actor=actor, org=org, action=action, metadata=metadata)
