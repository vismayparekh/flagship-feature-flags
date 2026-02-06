from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.flags.views import FeatureFlagViewSet, FlagStateViewSet, FlagRuleViewSet, sdk_evaluate

router = DefaultRouter()
router.register(r"flags", FeatureFlagViewSet, basename="flag")
router.register(r"flag-states", FlagStateViewSet, basename="flagstate")
router.register(r"flag-rules", FlagRuleViewSet, basename="flagrule")

urlpatterns = [
    path("", include(router.urls)),
    path("sdk/evaluate/", sdk_evaluate, name="sdk-evaluate"),
]
