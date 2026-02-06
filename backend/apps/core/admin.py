from django.contrib import admin
from apps.core.models import Organization, Membership, Project, Environment

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "created_at")
    search_fields = ("name", "slug")

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "org", "user", "role", "created_at")
    list_filter = ("role",)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "org", "name", "key", "created_at")
    search_fields = ("name", "key")

@admin.register(Environment)
class EnvironmentAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "name", "key", "created_at")
    search_fields = ("name", "key", "client_sdk_key")
