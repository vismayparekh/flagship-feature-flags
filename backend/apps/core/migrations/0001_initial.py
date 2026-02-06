# Generated manually for this template
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("key", models.SlugField(max_length=64)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("org", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="projects", to="core.organization")),
            ],
            options={
                "unique_together": {("org", "key")},
            },
        ),
        migrations.CreateModel(
            name="Environment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("key", models.SlugField(max_length=64)),
                ("client_sdk_key", models.CharField(blank=True, default="", max_length=128, unique=True)),
                ("server_sdk_key", models.CharField(blank=True, default="", max_length=128, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="environments", to="core.project")),
            ],
            options={
                "unique_together": {("project", "key")},
            },
        ),
        migrations.CreateModel(
            name="Membership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("owner", "Owner"), ("admin", "Admin"), ("developer", "Developer"), ("viewer", "Viewer")], default="viewer", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("org", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="core.organization")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("org", "user")},
            },
        ),
    ]
