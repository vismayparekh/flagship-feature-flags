from django.db import models
from apps.core.models import Project, Environment

class FeatureFlag(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="flags")
    key = models.SlugField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "key")

    def __str__(self):
        return f"{self.project.org.slug}/{self.project.key}:{self.key}"

class FlagState(models.Model):
    flag = models.ForeignKey(FeatureFlag, on_delete=models.CASCADE, related_name="states")
    environment = models.ForeignKey(Environment, on_delete=models.CASCADE, related_name="flag_states")
    enabled = models.BooleanField(default=False)

    on_variation = models.JSONField(default=dict)
    off_variation = models.JSONField(default=dict)
    default_variation = models.JSONField(default=dict)

    rollout_percentage = models.PositiveIntegerField(default=100)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("flag", "environment")

class FlagRule(models.Model):
    state = models.ForeignKey(FlagState, on_delete=models.CASCADE, related_name="rules")
    priority = models.PositiveIntegerField(default=0)
    clauses = models.JSONField(default=list)
    variation = models.JSONField(default=dict)
    rollout_percentage = models.PositiveIntegerField(default=100)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority", "id"]
