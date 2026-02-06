from apps.core.models import Organization, Membership, Project, Environment
from apps.flags.models import FeatureFlag, FlagState

def bootstrap_org_for_new_user(user):
    if user.is_superuser:
        return
    org = Organization.objects.create(name=(user.full_name or user.email.split("@")[0]) + " Org")
    Membership.objects.create(org=org, user=user, role="owner")
    project = Project.objects.create(org=org, name="Demo Project", key="demo", description="Starter project")
    env = Environment.objects.create(project=project, name="Production", key="prod")
    flag = FeatureFlag.objects.create(project=project, key="new_checkout", name="New Checkout", description="Example boolean flag")
    FlagState.objects.create(
        flag=flag,
        environment=env,
        enabled=False,
        on_variation={"value": True},
        off_variation={"value": False},
        default_variation={"value": False},
    )
