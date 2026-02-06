from django.db import models
from django.conf import settings
from django.utils.text import slugify
import secrets

ROLE_CHOICES = (
    ("owner", "Owner"),
    ("admin", "Admin"),
    ("developer", "Developer"),
    ("viewer", "Viewer"),
)

def gen_key(prefix=""):
    return prefix + secrets.token_urlsafe(24)

class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:40] or "org"
            cand = base
            i = 1
            while Organization.objects.filter(slug=cand).exists():
                i += 1
                cand = f"{base}-{i}"
            self.slug = cand
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Membership(models.Model):
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="viewer")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("org", "user")

    def __str__(self):
        return f"{self.user.email} in {self.org.slug} ({self.role})"

class Project(models.Model):
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    key = models.SlugField(max_length=64)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("org", "key")

    def __str__(self):
        return f"{self.org.slug}/{self.key}"

class Environment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="environments")
    name = models.CharField(max_length=255)
    key = models.SlugField(max_length=64)
    client_sdk_key = models.CharField(max_length=128, unique=True, default="", blank=True)
    server_sdk_key = models.CharField(max_length=128, unique=True, default="", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "key")

    def save(self, *args, **kwargs):
        if not self.client_sdk_key:
            self.client_sdk_key = gen_key("c_")
        if not self.server_sdk_key:
            self.server_sdk_key = gen_key("s_")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.org.slug}/{self.project.key}/{self.key}"
