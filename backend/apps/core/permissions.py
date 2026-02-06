from rest_framework.permissions import BasePermission
from apps.core.models import Membership

ROLE_ORDER = {
    "viewer": 0,
    "developer": 1,
    "admin": 2,
    "owner": 3,
}

class HasMinRole(BasePermission):
    """
    Set view.min_role = "developer"/"admin"/"owner"
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_superuser:
            return True
        min_role = getattr(view, "min_role", "viewer")
        org_id = view.kwargs.get("org_id") or request.data.get("org") or request.query_params.get("org_id")
        if not org_id:
            return True
        m = Membership.objects.filter(org_id=org_id, user=request.user).first()
        if not m:
            return False
        return ROLE_ORDER.get(m.role, 0) >= ROLE_ORDER.get(min_role, 0)
