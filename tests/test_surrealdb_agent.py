import pytest
from ceiling.agent.surrealdb_agent import SurrealDBAgent
from ceiling_panel_calc import LayoutResult, Dimensions, Gap, Material


class TestSurrealDBAgentRED:
    """RED phase: Tests for SurrealDB agent functionality that should fail until implemented"""

    def test_surrealdb_agent_init_fails(self):
        agent = SurrealDBAgent()
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.connect()

    def test_store_layout_fails(self):
        agent = SurrealDBAgent()
        layout = LayoutResult(
            panel_width_mm=1200,
            panel_length_mm=1800,
            panel_count=6,
            total_coverage_sqm=12.96,
            efficiency=0.85,
        )
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.store_layout("test_project", layout)

    def test_query_relationships_fails(self):
        agent = SurrealDBAgent()
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.query_related_components("test_project")

    def test_notification_system_fails(self):
        agent = SurrealDBAgent()
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.setup_notifications()

    def test_multi_tenant_isolation_fails(self):
        agent = SurrealDBAgent()
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.switch_tenant("tenant_123")

    def test_backup_restore_fails(self):
        agent = SurrealDBAgent()
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.create_backup()

    def test_complex_query_fails(self):
        agent = SurrealDBAgent()
        query = (
            "SELECT * FROM component WHERE type = 'panel' AND project_id = $project_id"
        )
        # Should fail - not implemented yet
        with pytest.raises(NotImplementedError):
            agent.execute_query(query, {"project_id": "test"})
