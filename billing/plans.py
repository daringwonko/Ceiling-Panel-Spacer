"""
Subscription plans and usage tracking for billing.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


class PlanTier(str, Enum):
    """Subscription plan tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class PlanLimits:
    """Limits for a subscription plan."""
    calculations_per_month: int
    projects: int
    export_formats: List[str]
    storage_mb: int
    api_requests_per_minute: int
    team_members: int
    ml_optimization: bool = False
    priority_support: bool = False
    sso: bool = False
    custom_branding: bool = False


@dataclass
class Plan:
    """Subscription plan definition."""
    id: str
    name: str
    tier: PlanTier
    price_monthly: float
    price_yearly: float
    limits: PlanLimits
    description: str = ""
    features: List[str] = field(default_factory=list)
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'tier': self.tier.value,
            'price_monthly': self.price_monthly,
            'price_yearly': self.price_yearly,
            'limits': {
                'calculations_per_month': self.limits.calculations_per_month,
                'projects': self.limits.projects,
                'export_formats': self.limits.export_formats,
                'storage_mb': self.limits.storage_mb,
                'api_requests_per_minute': self.limits.api_requests_per_minute,
                'team_members': self.limits.team_members,
                'ml_optimization': self.limits.ml_optimization,
                'priority_support': self.limits.priority_support,
                'sso': self.limits.sso,
            },
            'features': self.features,
        }


# Predefined plans
PLANS = {
    'free': Plan(
        id='free',
        name='Free',
        tier=PlanTier.FREE,
        price_monthly=0,
        price_yearly=0,
        limits=PlanLimits(
            calculations_per_month=10,
            projects=3,
            export_formats=['svg'],
            storage_mb=100,
            api_requests_per_minute=20,
            team_members=1,
        ),
        description='Perfect for getting started',
        features=[
            '10 calculations per month',
            '3 projects',
            'SVG exports',
            '100 MB storage',
            'Email support',
        ]
    ),
    'pro': Plan(
        id='pro',
        name='Pro',
        tier=PlanTier.PRO,
        price_monthly=29,
        price_yearly=290,
        limits=PlanLimits(
            calculations_per_month=500,
            projects=50,
            export_formats=['svg', 'dxf', 'obj', 'stl', 'gltf'],
            storage_mb=5000,
            api_requests_per_minute=100,
            team_members=5,
            ml_optimization=True,
        ),
        description='For professionals and small teams',
        features=[
            '500 calculations per month',
            '50 projects',
            'All export formats',
            '5 GB storage',
            'ML optimization',
            'Up to 5 team members',
            'Priority email support',
            'API access',
        ]
    ),
    'enterprise': Plan(
        id='enterprise',
        name='Enterprise',
        tier=PlanTier.ENTERPRISE,
        price_monthly=0,  # Custom pricing
        price_yearly=0,
        limits=PlanLimits(
            calculations_per_month=-1,  # Unlimited
            projects=-1,
            export_formats=['svg', 'dxf', 'obj', 'stl', 'gltf', 'step', 'ifc'],
            storage_mb=-1,
            api_requests_per_minute=500,
            team_members=-1,
            ml_optimization=True,
            priority_support=True,
            sso=True,
            custom_branding=True,
        ),
        description='For large organizations',
        features=[
            'Unlimited calculations',
            'Unlimited projects',
            'All export formats + STEP & IFC',
            'Unlimited storage',
            'Advanced ML optimization',
            'Unlimited team members',
            'SSO/SAML',
            'Custom branding',
            'Dedicated support',
            'SLA guarantee',
            'On-premise deployment option',
        ]
    ),
}


@dataclass
class Subscription:
    """Organization subscription."""
    id: str = field(default_factory=lambda: f"sub_{uuid.uuid4().hex[:12]}")
    organization_id: str = ""
    plan_id: str = "free"
    status: str = "active"  # active, canceled, past_due, trialing
    current_period_start: datetime = field(default_factory=datetime.utcnow)
    current_period_end: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    cancel_at_period_end: bool = False
    canceled_at: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None

    def is_active(self) -> bool:
        """Check if subscription is active."""
        return self.status in ['active', 'trialing'] and datetime.utcnow() < self.current_period_end

    def get_plan(self) -> Plan:
        """Get the associated plan."""
        return PLANS.get(self.plan_id, PLANS['free'])

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'plan_id': self.plan_id,
            'plan': self.get_plan().to_dict(),
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat(),
            'current_period_end': self.current_period_end.isoformat(),
            'cancel_at_period_end': self.cancel_at_period_end,
        }


@dataclass
class UsageRecord:
    """Usage tracking record."""
    id: str = field(default_factory=lambda: f"usage_{uuid.uuid4().hex[:12]}")
    organization_id: str = ""
    metric: str = ""  # calculations, exports, api_calls, storage_bytes
    value: int = 0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


class UsageTracker:
    """Track and aggregate usage metrics."""

    def __init__(self):
        self._usage: Dict[str, List[UsageRecord]] = {}

    def record(
        self,
        organization_id: str,
        metric: str,
        value: int = 1,
        metadata: Dict[str, Any] = None
    ) -> UsageRecord:
        """Record a usage event."""
        record = UsageRecord(
            organization_id=organization_id,
            metric=metric,
            value=value,
            metadata=metadata or {}
        )

        if organization_id not in self._usage:
            self._usage[organization_id] = []
        self._usage[organization_id].append(record)

        return record

    def get_usage(
        self,
        organization_id: str,
        metric: str,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> int:
        """Get aggregated usage for a metric."""
        if organization_id not in self._usage:
            return 0

        start_date = start_date or (datetime.utcnow() - timedelta(days=30))
        end_date = end_date or datetime.utcnow()

        total = 0
        for record in self._usage[organization_id]:
            if record.metric == metric and start_date <= record.timestamp <= end_date:
                total += record.value

        return total

    def get_all_usage(
        self,
        organization_id: str,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, int]:
        """Get all usage metrics for an organization."""
        if organization_id not in self._usage:
            return {}

        start_date = start_date or (datetime.utcnow() - timedelta(days=30))
        end_date = end_date or datetime.utcnow()

        metrics: Dict[str, int] = {}
        for record in self._usage[organization_id]:
            if start_date <= record.timestamp <= end_date:
                if record.metric not in metrics:
                    metrics[record.metric] = 0
                metrics[record.metric] += record.value

        return metrics

    def check_limit(
        self,
        organization_id: str,
        metric: str,
        subscription: Subscription
    ) -> tuple:
        """
        Check if usage is within limits.

        Returns:
            (is_within_limit, current_usage, limit)
        """
        plan = subscription.get_plan()
        limits = plan.limits

        limit_map = {
            'calculations': limits.calculations_per_month,
            'projects': limits.projects,
            'storage_mb': limits.storage_mb,
            'team_members': limits.team_members,
        }

        limit = limit_map.get(metric, -1)

        if limit == -1:  # Unlimited
            return True, self.get_usage(organization_id, metric), -1

        current = self.get_usage(organization_id, metric)
        return current < limit, current, limit


@dataclass
class Invoice:
    """Invoice for billing."""
    id: str = field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    organization_id: str = ""
    subscription_id: str = ""
    amount_cents: int = 0
    currency: str = "usd"
    status: str = "draft"  # draft, open, paid, void, uncollectible
    period_start: datetime = field(default_factory=datetime.utcnow)
    period_end: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)
    paid_at: Optional[datetime] = None
    stripe_invoice_id: Optional[str] = None
    pdf_url: Optional[str] = None
    line_items: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'amount': self.amount_cents / 100,
            'currency': self.currency,
            'status': self.status,
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'created_at': self.created_at.isoformat(),
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'pdf_url': self.pdf_url,
            'line_items': self.line_items,
        }


def get_plan(plan_id: str) -> Optional[Plan]:
    """Get a plan by ID."""
    return PLANS.get(plan_id)


def list_plans(include_enterprise: bool = False) -> List[Plan]:
    """List available plans."""
    plans = [PLANS['free'], PLANS['pro']]
    if include_enterprise:
        plans.append(PLANS['enterprise'])
    return plans
