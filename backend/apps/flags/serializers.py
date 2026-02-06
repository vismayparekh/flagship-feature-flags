from rest_framework import serializers
from apps.flags.models import FeatureFlag, FlagState, FlagRule


class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = ["id", "project", "key", "name", "description", "created_at"]
        read_only_fields = ["created_at"]


class FlagRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlagRule
        fields = ["id", "state", "priority", "clauses", "variation", "rollout_percentage", "created_at"]
        read_only_fields = ["created_at"]


class FlagStateSerializer(serializers.ModelSerializer):
    rules = FlagRuleSerializer(many=True, read_only=True)

    class Meta:
        model = FlagState
        fields = [
            "id", "flag", "environment", "enabled",
            "on_variation", "off_variation", "default_variation",
            "rollout_percentage", "rules", "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]


# ✅ Used for PATCH updates from UI (rollout slider + enabled)
class FlagStateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlagState
        fields = ["enabled", "rollout_percentage"]

    def validate_rollout_percentage(self, value):
        if value is None:
            return value
        if value < 0 or value > 100:
            raise serializers.ValidationError("Rollout must be between 0 and 100.")
        return value
