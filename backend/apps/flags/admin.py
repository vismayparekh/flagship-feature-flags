from django.contrib import admin
from apps.flags.models import FeatureFlag, FlagState, FlagRule

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "key", "name", "created_at")
    search_fields = ("key", "name")

@admin.register(FlagState)
class FlagStateAdmin(admin.ModelAdmin):
    list_display = ("id", "flag", "environment", "enabled", "rollout_percentage", "updated_at")
    list_filter = ("enabled", "rollout_percentage")

@admin.register(FlagRule)
class FlagRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "state", "priority", "rollout_percentage", "created_at")
