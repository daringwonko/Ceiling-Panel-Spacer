import pytest
from ceiling.agent.surrealdb_agent import SurrealDBAgent
from core.ceiling_panel_calc import (
    PanelLayout,
)


class TestSurrealDBAgentImplemented:
    """Tests for SurrealDB agent functionality - verifying implementation works"""

    @pytest.fixture
    def agent(self):
        """Create a SurrealDBAgent instance"""
        return SurrealDBAgent()

    @pytest.mark.asyncio
    async def test_connect_fails_without_server(self, agent):
        """Test that connect raises ConnectionError when SurrealDB server not available"""
        with pytest.raises(ConnectionError):
            await agent.connect()

    @pytest.mark.asyncio
    async def test_store_layout_requires_tenant(self, agent):
        """Test that store_layout raises ValueError when no tenant selected"""
        layout = PanelLayout(
            panel_width_mm=1200,
            panel_length_mm=1800,
            panels_per_row=2,
            panels_per_column=3,
            total_panels=6,
            total_coverage_sqm=12.96,
            gap_area_sqm=0.5,
        )
        with pytest.raises(ValueError, match="No tenant selected"):
            await agent.store_layout("test_project", layout)

    @pytest.mark.asyncio
    async def test_query_related_components_requires_tenant(self, agent):
        """Test that query_related_components raises ValueError when no tenant selected"""
        with pytest.raises(ValueError, match="No tenant selected"):
            await agent.query_related_components("test_project")

    @pytest.mark.asyncio
    async def test_setup_notifications_requires_tenant(self, agent):
        """Test that setup_notifications raises ValueError when no tenant selected"""
        with pytest.raises(ValueError, match="No tenant selected"):
            await agent.setup_notifications()

    @pytest.mark.asyncio
    async def test_switch_tenant_works(self, agent):
        """Test that switch_tenant sets the current tenant"""
        await agent.switch_tenant("tenant_123")
        assert agent.current_tenant == "tenant_123"

    @pytest.mark.asyncio
    async def test_create_backup_requires_tenant(self, agent):
        """Test that create_backup raises ValueError when no tenant selected"""
        with pytest.raises(ValueError, match="No tenant selected"):
            await agent.create_backup()

    @pytest.mark.asyncio
    async def test_execute_query_requires_tenant(self, agent):
        """Test that execute_query raises ValueError when no tenant selected"""
        query = "SELECT * FROM component WHERE type = 'panel'"
        with pytest.raises(ValueError, match="No tenant selected"):
            await agent.execute_query(query, {})

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """Test that SurrealDBAgent can be initialized with default values"""
        agent = SurrealDBAgent()
        assert agent.url == "ws://localhost:8000"
        assert agent.namespace == "ceiling"
        assert agent.db is None
        assert agent.current_tenant is None

    @pytest.mark.asyncio
    async def test_agent_initialization_custom_values(self):
        """Test that SurrealDBAgent can be initialized with custom values"""
        agent = SurrealDBAgent(url="ws://custom:9000", namespace="custom_ns")
        assert agent.url == "ws://custom:9000"
        assert agent.namespace == "custom_ns"

    @pytest.mark.asyncio
    async def test_switch_tenant_clears_notification_listeners(self, agent):
        """Test that switching tenant clears notification listeners"""
        await agent.switch_tenant("tenant_1")
        agent.notification_listeners["test"] = None
        await agent.switch_tenant("tenant_2")
        assert agent.current_tenant == "tenant_2"
        assert len(agent.notification_listeners) == 0
