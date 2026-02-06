from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import OrganizationViewSet, ProjectViewSet, EnvironmentViewSet, MembershipViewSet

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="org")
router.register(r"memberships", MembershipViewSet, basename="membership")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"environments", EnvironmentViewSet, basename="environment")

urlpatterns = [
    path("", include(router.urls)),
]
