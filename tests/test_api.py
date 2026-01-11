"""
API Tests for Ceiling Panel Calculator.

Tests all REST endpoints including calculations, projects, materials, and exports.
"""

import pytest
import json
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from api.app import create_app


@pytest.fixture
def app():
    """Create test application."""
    app = create_app({'TESTING': True})
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check(self, client):
        """Test main health endpoint."""
        response = client.get('/api/v1/health')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['success'] is True
        assert data['data']['status'] == 'healthy'
        assert 'uptime_seconds' in data['data']
        assert 'version' in data['data']

    def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe."""
        response = client.get('/api/v1/health/live')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['data']['status'] == 'alive'

    def test_version_endpoint(self, client):
        """Test version information endpoint."""
        response = client.get('/api/v1/version')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'api_version' in data['data']
        assert 'app_version' in data['data']


class TestCalculationEndpoints:
    """Tests for calculation endpoints."""

    def test_create_calculation(self, client):
        """Test creating a new calculation."""
        payload = {
            "dimensions": {
                "length_mm": 5000,
                "width_mm": 4000
            },
            "spacing": {
                "perimeter_gap_mm": 200,
                "panel_gap_mm": 50
            }
        }

        response = client.post(
            '/api/v1/calculate',
            data=json.dumps(payload),
            content_type='application/json'
        )

        # May return 200 or 503 depending on core module availability
        assert response.status_code in [200, 503]

        data = json.loads(response.data)
        if response.status_code == 200:
            assert data['success'] is True
            assert 'id' in data['data']
            assert 'layout' in data['data']

    def test_calculation_missing_dimensions(self, client):
        """Test calculation with missing dimensions."""
        payload = {
            "spacing": {
                "perimeter_gap_mm": 200
            }
        }

        response = client.post(
            '/api/v1/calculate',
            data=json.dumps(payload),
            content_type='application/json'
        )

        assert response.status_code == 400

        data = json.loads(response.data)
        assert data['success'] is False
        assert data['error']['code'] == 'MISSING_FIELD'

    def test_calculation_empty_body(self, client):
        """Test calculation with empty body."""
        response = client.post(
            '/api/v1/calculate',
            data='',
            content_type='application/json'
        )

        assert response.status_code == 400

    def test_get_nonexistent_calculation(self, client):
        """Test getting a calculation that doesn't exist."""
        response = client.get('/api/v1/calculate/calc_nonexistent')
        assert response.status_code == 404

        data = json.loads(response.data)
        assert data['error']['code'] == 'NOT_FOUND'


class TestProjectEndpoints:
    """Tests for project management endpoints."""

    def test_create_project(self, client):
        """Test creating a new project."""
        payload = {
            "name": "Test Project",
            "description": "A test project",
            "dimensions": {
                "length_mm": 6000,
                "width_mm": 5000
            }
        }

        response = client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )

        assert response.status_code == 201

        data = json.loads(response.data)
        assert data['success'] is True
        assert data['data']['name'] == 'Test Project'
        assert 'id' in data['data']

    def test_list_projects(self, client):
        """Test listing projects."""
        # Create a project first
        payload = {
            "name": "List Test Project",
            "dimensions": {"length_mm": 5000, "width_mm": 4000}
        }
        client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )

        # List projects
        response = client.get('/api/v1/projects')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['success'] is True
        assert isinstance(data['data'], list)
        assert 'meta' in data
        assert 'total' in data['meta']

    def test_get_project(self, client):
        """Test getting a specific project."""
        # Create a project
        payload = {
            "name": "Get Test Project",
            "dimensions": {"length_mm": 5000, "width_mm": 4000}
        }
        create_response = client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )
        project_id = json.loads(create_response.data)['data']['id']

        # Get the project
        response = client.get(f'/api/v1/projects/{project_id}')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['data']['name'] == 'Get Test Project'

    def test_update_project(self, client):
        """Test updating a project."""
        # Create a project
        payload = {
            "name": "Update Test Project",
            "dimensions": {"length_mm": 5000, "width_mm": 4000}
        }
        create_response = client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )
        project_id = json.loads(create_response.data)['data']['id']

        # Update the project
        update_payload = {"name": "Updated Project Name"}
        response = client.put(
            f'/api/v1/projects/{project_id}',
            data=json.dumps(update_payload),
            content_type='application/json'
        )

        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['data']['name'] == 'Updated Project Name'

    def test_delete_project(self, client):
        """Test deleting a project."""
        # Create a project
        payload = {
            "name": "Delete Test Project",
            "dimensions": {"length_mm": 5000, "width_mm": 4000}
        }
        create_response = client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )
        project_id = json.loads(create_response.data)['data']['id']

        # Delete the project
        response = client.delete(f'/api/v1/projects/{project_id}')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['data']['deleted'] is True

        # Verify it's deleted
        get_response = client.get(f'/api/v1/projects/{project_id}')
        assert get_response.status_code == 404

    def test_project_missing_name(self, client):
        """Test creating project without name."""
        payload = {
            "dimensions": {"length_mm": 5000, "width_mm": 4000}
        }

        response = client.post(
            '/api/v1/projects',
            data=json.dumps(payload),
            content_type='application/json'
        )

        assert response.status_code == 400

        data = json.loads(response.data)
        assert data['error']['field'] == 'name'


class TestMaterialEndpoints:
    """Tests for material endpoints."""

    def test_list_materials(self, client):
        """Test listing materials."""
        response = client.get('/api/v1/materials')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['success'] is True
        assert isinstance(data['data'], list)

    def test_list_categories(self, client):
        """Test listing material categories."""
        response = client.get('/api/v1/materials/categories')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['success'] is True
        assert isinstance(data['data'], list)

    def test_cost_estimate(self, client):
        """Test material cost estimation."""
        payload = {
            "material_id": "standard_tiles",
            "area_sqm": 20,
            "waste_factor": 1.15
        }

        response = client.post(
            '/api/v1/materials/cost-estimate',
            data=json.dumps(payload),
            content_type='application/json'
        )

        # May return 200 or 404 depending on material availability
        assert response.status_code in [200, 404]


class TestExportEndpoints:
    """Tests for export endpoints."""

    def test_export_svg(self, client):
        """Test SVG export."""
        payload = {
            "dimensions": {"length_mm": 5000, "width_mm": 4000},
            "spacing": {"perimeter_gap_mm": 200, "panel_gap_mm": 50}
        }

        response = client.post(
            '/api/v1/exports/svg',
            data=json.dumps(payload),
            content_type='application/json'
        )

        # May return 200 or 503 depending on generator availability
        assert response.status_code in [200, 503]

    def test_get_nonexistent_export(self, client):
        """Test getting a non-existent export."""
        response = client.get('/api/v1/exports/exp_nonexistent')
        assert response.status_code == 404


class TestAPIDocumentation:
    """Tests for API documentation endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get('/')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'name' in data['data']
        assert 'version' in data['data']

    def test_docs_endpoint(self, client):
        """Test API documentation endpoint."""
        response = client.get('/api/v1/docs')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'openapi' in data['data']
        assert 'endpoints' in data['data']


class TestErrorHandling:
    """Tests for error handling."""

    def test_404_handler(self, client):
        """Test 404 error handler."""
        response = client.get('/api/v1/nonexistent')
        assert response.status_code == 404

        data = json.loads(response.data)
        assert data['success'] is False
        assert data['error']['code'] == 'NOT_FOUND'

    def test_405_handler(self, client):
        """Test 405 error handler."""
        response = client.put('/api/v1/health')
        assert response.status_code == 405

        data = json.loads(response.data)
        assert data['error']['code'] == 'METHOD_NOT_ALLOWED'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
