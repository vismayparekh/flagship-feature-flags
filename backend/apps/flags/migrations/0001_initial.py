# Generated manually for this template
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FeatureFlag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="flags", to="core.project")),
            ],
            options={
                "unique_together": {("project", "key")},
            },
        ),
        migrations.CreateModel(
            name="FlagState",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enabled", models.BooleanField(default=False)),
                ("on_variation", models.JSONField(default=dict)),
                ("off_variation", models.JSONField(default=dict)),
                ("default_variation", models.JSONField(default=dict)),
                ("rollout_percentage", models.PositiveIntegerField(default=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("environment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="flag_states", to="core.environment")),
                ("flag", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="states", to="flags.featureflag")),
            ],
            options={
                "unique_together": {("flag", "environment")},
            },
        ),
        migrations.CreateModel(
            name="FlagRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("priority", models.PositiveIntegerField(default=0)),
                ("clauses", models.JSONField(default=list)),
                ("variation", models.JSONField(default=dict)),
                ("rollout_percentage", models.PositiveIntegerField(default=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("state", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rules", to="flags.flagstate")),
            ],
            options={
                "ordering": ["priority", "id"],
            },
        ),
    ]
