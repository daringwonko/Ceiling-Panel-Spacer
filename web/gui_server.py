#!/usr/bin/env python3
"""
Ceiling Panel Calculator - Web GUI Server
Flask backend providing REST API for the 3D GUI frontend.
"""

from flask import Flask, render_template, jsonify, request, send_file, g
from flask_cors import CORS
import json
import os
from pathlib import Path
from datetime import datetime, timedelta

from ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    ProjectExporter,
    MaterialLibrary,
)
from iot_sensor_network import SensorNetworkManager, SensorType, SensorStatus
from predictive_maintenance import PredictiveMaintenanceEngine
from energy_optimization import EnergyOptimizationEngine
from iot_security import IoTSecurityManager, require_auth, require_permission, SecurityLevel, UserRole

app = Flask(__name__, template_folder='.')
CORS(app)

@app.before_request
def before_request():
    """Make security manager available in request context"""
    g.security_manager = security_manager

# Store current project state
current_project = {
    'ceiling': None,
    'spacing': None,
    'layout': None,
    'material': None,
}

# Initialize IoT and smart building components
sensor_network = SensorNetworkManager()
maintenance_engine = PredictiveMaintenanceEngine(sensor_network)
energy_engine = EnergyOptimizationEngine(sensor_network)
security_manager = IoTSecurityManager()


@app.route('/')
def index():
    """Serve the main GUI"""
    return render_template('index.html')


@app.route('/api/materials', methods=['GET'])
def get_materials():
    """Get list of available materials"""
    materials = MaterialLibrary.list_materials()
    return jsonify({
        'success': True,
        'materials': materials
    })


@app.route('/api/material/<name>', methods=['GET'])
def get_material(name):
    """Get material details"""
    try:
        material = MaterialLibrary.get_material(name)
        return jsonify({
            'success': True,
            'material': {
                'name': material.name,
                'category': material.category,
                'color': material.color,
                'reflectivity': material.reflectivity,
                'cost_per_sqm': material.cost_per_sqm,
                'notes': material.notes,
            }
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/calculate', methods=['POST'])
def calculate_layout():
    """Calculate optimal panel layout"""
    try:
        data = request.json
        
        # Validate and create objects
        ceiling = CeilingDimensions(
            length_mm=float(data['ceiling_length']),
            width_mm=float(data['ceiling_width'])
        )
        
        spacing = PanelSpacing(
            perimeter_gap_mm=float(data['perimeter_gap']),
            panel_gap_mm=float(data['panel_gap'])
        )
        
        # Calculate layout
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout(
            optimization_strategy=data.get('optimization_strategy', 'balanced')
        )
        
        # Get material
        material = MaterialLibrary.get_material(data['material_name'])
        
        # Store in current project
        current_project['ceiling'] = ceiling
        current_project['spacing'] = spacing
        current_project['layout'] = layout
        current_project['material'] = material
        
        # Calculate costs
        exporter = ProjectExporter(
            ceiling=ceiling,
            spacing=spacing,
            layout=layout,
            material=material,
            waste_factor=float(data.get('waste_factor', 0.15)),
            labor_multiplier=float(data['labor_multiplier']) if data.get('labor_multiplier') else None
        )
        costs = exporter._calculate_costs()
        
        # Return layout data
        return jsonify({
            'success': True,
            'layout': {
                'panel_width': layout.panel_width_mm,
                'panel_length': layout.panel_length_mm,
                'panels_per_row': layout.panels_per_row,
                'panels_per_column': layout.panels_per_column,
                'total_panels': layout.total_panels,
                'coverage': layout.total_coverage_sqm,
            },
            'ceiling': {
                'length': ceiling.length_mm,
                'width': ceiling.width_mm,
                'area': (ceiling.length_mm * ceiling.width_mm) / 1_000_000,
            },
            'costs': costs,
            'material': {
                'name': material.name,
                'category': material.category,
                'cost_per_sqm': material.cost_per_sqm,
            }
        })
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Calculation error: {str(e)}'}), 500


@app.route('/api/export/<format>', methods=['POST'])
def export_project(format):
    """Export project in specified format"""
    try:
        if not all([current_project['ceiling'], current_project['layout']]):
            return jsonify({'success': False, 'error': 'No project to export'}), 400
        
        data = request.json
        exporter = ProjectExporter(
            ceiling=current_project['ceiling'],
            spacing=current_project['spacing'],
            layout=current_project['layout'],
            material=current_project['material'],
            waste_factor=float(data.get('waste_factor', 0.15)),
            labor_multiplier=float(data['labor_multiplier']) if data.get('labor_multiplier') else None
        )
        
        output_dir = data.get('output_dir', '.')
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        if format == 'json':
            filename = f"{output_dir}/ceiling_project_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            exporter.export_json(filename)
        elif format == 'dxf':
            filename = f"{output_dir}/ceiling_layout_{datetime.now().strftime('%Y%m%d_%H%M%S')}.dxf"
            exporter.export_dxf(filename)
        elif format == 'svg':
            filename = f"{output_dir}/ceiling_layout_{datetime.now().strftime('%Y%m%d_%H%M%S')}.svg"
            exporter.export_svg(filename)
        elif format == 'report':
            filename = f"{output_dir}/ceiling_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(filename, 'w') as f:
                f.write(exporter.generate_report())
        else:
            return jsonify({'success': False, 'error': f'Unknown format: {format}'}), 400
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': f'Exported to {filename}'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/config/default', methods=['GET'])
def get_default_config():
    """Get default configuration"""
    return jsonify({
        'ceiling_length': 5000,
        'ceiling_width': 4000,
        'perimeter_gap': 200,
        'panel_gap': 200,
        'material_name': 'led_panel_white',
        'waste_factor': 0.15,
        'labor_multiplier': 0.25,
        'optimization_strategy': 'balanced',
    })


@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """Get available optimization strategies"""
    return jsonify({
        'strategies': [
            {
                'id': 'balanced',
                'name': 'Balanced',
                'description': 'Balance panel count, sizing, and coverage'
            },
            {
                'id': 'minimize_seams',
                'name': 'Minimize Seams',
                'description': 'Prefer fewer panels and connections'
            }
        ]
    })


# ============================================================================
# SMART BUILDING IoT API ENDPOINTS
# ============================================================================

@app.route('/api/iot/network/status', methods=['GET'])
@require_auth(SecurityLevel.BASIC)
@require_permission('read:sensors')
def get_network_status():
    """Get IoT sensor network status"""
    try:
        status = sensor_network.get_network_status()
        nodes = [node.to_dict() for node in sensor_network.db.get_all_nodes()]

        return jsonify({
            'success': True,
            'network_status': status,
            'nodes': nodes,
            'mqtt_connected': sensor_network.mqtt.connected
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/iot/sensors/<sensor_id>/data', methods=['GET'])
def get_sensor_data(sensor_id):
    """Get sensor data for specific sensor"""
    try:
        hours = int(request.args.get('hours', 24))
        data = sensor_network.get_sensor_data(sensor_id, hours)

        return jsonify({
            'success': True,
            'sensor_id': sensor_id,
            'data_points': len(data),
            'data': [d.to_dict() for d in data[-100:]]  # Last 100 points
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/iot/sensors/<sensor_id>/health', methods=['GET'])
def get_sensor_health(sensor_id):
    """Get sensor health analysis"""
    try:
        health = maintenance_engine.analyze_sensor_health(sensor_id)
        return jsonify({
            'success': True,
            'sensor_id': sensor_id,
            'health': health
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/iot/nodes', methods=['POST'])
@require_auth(SecurityLevel.SECURE)
@require_permission('write:nodes')
def add_sensor_node():
    """Add a new sensor node to the network"""
    try:
        data = request.json

        from iot_sensor_network import SensorNode
        node = SensorNode(
            node_id=data['node_id'],
            location=data['location'],
            sensors=[SensorType(s) for s in data['sensors']],
            status=SensorStatus(data.get('status', 'online')),
            battery_level=data.get('battery_level', 100.0),
            last_seen=datetime.now(),
            firmware_version=data.get('firmware_version', '1.0.0'),
            capabilities=data.get('capabilities', {})
        )

        sensor_network.add_sensor_node(node)

        return jsonify({
            'success': True,
            'message': f'Node {node.node_id} added to network',
            'node': node.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/iot/commands/<node_id>', methods=['POST'])
@require_auth(SecurityLevel.SECURE)
@require_permission('write:commands')
def send_node_command(node_id):
    """Send command to a sensor node"""
    try:
        data = request.json
        command = data.get('command', 'status')
        parameters = data.get('parameters', {})

        # Publish command via MQTT
        topic = f"ceiling/commands/{node_id}"
        payload = json.dumps({
            'command': command,
            'parameters': parameters,
            'timestamp': datetime.now().isoformat()
        })

        sensor_network.mqtt.publish(topic, payload)

        return jsonify({
            'success': True,
            'message': f'Command sent to node {node_id}',
            'command': command
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# PREDICTIVE MAINTENANCE API ENDPOINTS
# ============================================================================

@app.route('/api/maintenance/predictions', methods=['GET'])
def get_maintenance_predictions():
    """Get maintenance predictions"""
    try:
        days_ahead = int(request.args.get('days', 30))
        predictions = maintenance_engine.get_maintenance_schedule(days_ahead)

        return jsonify({
            'success': True,
            'predictions': [p.to_dict() for p in predictions],
            'total_predictions': len(predictions),
            'period_days': days_ahead
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/maintenance/system/health', methods=['GET'])
def get_system_health():
    """Get overall system health analysis"""
    try:
        health = maintenance_engine.analyze_system_health()
        return jsonify({
            'success': True,
            'system_health': health
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/maintenance/panels/<panel_id>/predict', methods=['GET'])
def predict_panel_maintenance(panel_id):
    """Predict maintenance for specific panel"""
    try:
        from datetime import datetime
        installation_date = datetime.now() - timedelta(days=365)  # Default 1 year ago
        usage_cycles = int(request.args.get('usage_cycles', 1000))

        prediction = maintenance_engine.predict_panel_maintenance(
            panel_id, installation_date, usage_cycles
        )

        return jsonify({
            'success': True,
            'panel_id': panel_id,
            'prediction': prediction.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# ENERGY OPTIMIZATION API ENDPOINTS
# ============================================================================

@app.route('/api/energy/analysis', methods=['GET'])
def get_energy_analysis():
    """Get energy consumption analysis"""
    try:
        location = request.args.get('location')
        days = int(request.args.get('days', 30))

        analysis = energy_engine.analyze_energy_consumption(location, days)

        return jsonify({
            'success': True,
            'analysis': analysis,
            'location': location,
            'period_days': days
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/energy/optimizations', methods=['GET'])
def get_energy_optimizations():
    """Get energy optimization recommendations"""
    try:
        location = request.args.get('location')
        optimizations = energy_engine.generate_optimization_recommendations(location)

        return jsonify({
            'success': True,
            'optimizations': [opt.to_dict() for opt in optimizations],
            'total_optimizations': len(optimizations),
            'location': location
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/energy/dashboard', methods=['GET'])
def get_energy_dashboard():
    """Get energy dashboard data"""
    try:
        dashboard = energy_engine.get_energy_dashboard_data()
        return jsonify({
            'success': True,
            'dashboard': dashboard
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/energy/optimizations/<optimization_id>/implement', methods=['POST'])
def implement_energy_optimization(optimization_id):
    """Implement an energy optimization"""
    try:
        success = energy_engine.implement_optimization(optimization_id)

        return jsonify({
            'success': success,
            'optimization_id': optimization_id,
            'message': 'Optimization implemented successfully' if success else 'Implementation failed'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# INTEGRATION API ENDPOINTS
# ============================================================================

@app.route('/api/integration/webhook', methods=['POST'])
def integration_webhook():
    """Webhook endpoint for external integrations"""
    try:
        data = request.json
        source = data.get('source', 'unknown')
        event_type = data.get('event_type', 'unknown')

        # Process webhook data based on source
        if source == 'building_management_system':
            # Handle BMS integration
            pass
        elif source == 'energy_provider':
            # Handle energy provider data
            pass
        elif source == 'maintenance_system':
            # Handle maintenance system integration
            pass

        return jsonify({
            'success': True,
            'message': f'Webhook processed from {source}',
            'event_type': event_type
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/integration/export/<format>', methods=['GET'])
@require_auth(SecurityLevel.SECURE)
@require_permission('read:data')
def export_integration_data(format):
    """Export data for external systems"""
    try:
        data_type = request.args.get('type', 'all')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if format == 'json':
            # Export comprehensive JSON data
            export_data = {
                'metadata': {
                    'export_time': datetime.now().isoformat(),
                    'data_type': data_type,
                    'format': 'json'
                },
                'network_status': sensor_network.get_network_status(),
                'system_health': maintenance_engine.analyze_system_health(),
                'energy_analysis': energy_engine.analyze_energy_consumption(),
                'maintenance_predictions': [p.to_dict() for p in maintenance_engine.get_maintenance_schedule(30)]
            }

            return jsonify(export_data)

        elif format == 'csv':
            # Export as CSV (simplified)
            return jsonify({
                'success': False,
                'error': 'CSV export not implemented yet'
            }), 501

        else:
            return jsonify({
                'success': False,
                'error': f'Unsupported format: {format}'
            }), 400

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')  # In production, use proper password hashing

        # Simple authentication (replace with proper user management)
        if username == 'admin' and password == 'admin':
            token = security_manager.create_jwt_token(
                user_id=username,
                role=UserRole.ADMINISTRATOR,
                permissions=['*']
            )
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': username,
                    'role': 'administrator'
                }
            })
        elif username == 'operator' and password == 'operator':
            token = security_manager.create_jwt_token(
                user_id=username,
                role=UserRole.OPERATOR,
                permissions=['read:sensors', 'read:maintenance', 'read:energy', 'write:commands']
            )
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': username,
                    'role': 'operator'
                }
            })

        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/api-keys', methods=['POST'])
@require_auth(SecurityLevel.SECURE)
@require_permission('admin:api_keys')
def create_api_key():
    """Create a new API key"""
    try:
        data = request.json
        from iot_security import UserRole

        key = security_manager.create_api_key(
            name=data['name'],
            role=UserRole(data['role']),
            permissions=data['permissions'],
            expires_in_days=data.get('expires_in_days', 365),
            rate_limit=data.get('rate_limit', 100)
        )

        return jsonify({
            'success': True,
            'message': 'API key created',
            'key': key  # Only returned once for security
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/validate', methods=['GET'])
@require_auth(SecurityLevel.BASIC)
def validate_auth():
    """Validate current authentication"""
    user = g.user
    return jsonify({
        'success': True,
        'authenticated': True,
        'user': {
            'id': getattr(user, 'name', user.user_id),
            'role': user.role.value,
            'permissions': user.permissions
        },
        'auth_method': g.auth_method
    })


@app.route('/api/auth/logout', methods=['POST'])
@require_auth(SecurityLevel.SECURE)
def logout():
    """Logout (revoke JWT token)"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            security_manager.revoke_jwt_token(token)

        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def initialize_demo_data():
    """Initialize demo sensor nodes and data for testing"""
    try:
        from iot_sensor_network import SensorNode

        # Add demo sensor nodes
        demo_nodes = [
            SensorNode(
                node_id="ceiling_node_001",
                location={'x': 1000, 'y': 0, 'z': 2000},
                sensors=[SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.LIGHT_LEVEL],
                status=SensorStatus.ONLINE,
                battery_level=95.0,
                last_seen=datetime.now(),
                firmware_version="1.0.0",
                capabilities={'wireless': True, 'battery_powered': True}
            ),
            SensorNode(
                node_id="ceiling_node_002",
                location={'x': 3000, 'y': 0, 'z': 2000},
                sensors=[SensorType.OCCUPANCY, SensorType.ENERGY_CONSUMPTION],
                status=SensorStatus.ONLINE,
                battery_level=87.0,
                last_seen=datetime.now(),
                firmware_version="1.0.0",
                capabilities={'wireless': True, 'poe_powered': True}
            )
        ]

        for node in demo_nodes:
            try:
                sensor_network.add_sensor_node(node)
            except:
                pass  # Node might already exist

        print("Demo sensor nodes initialized")

    except Exception as e:
        print(f"Error initializing demo data: {e}")


if __name__ == '__main__':
    print("Starting Universal Architectural Design Engine - Smart Building Server...")
    print("Features: IoT Sensor Network, Predictive Maintenance, Energy Optimization")
    print("Open your browser to: http://localhost:5000")
    print()

    # Initialize demo data
    initialize_demo_data()

    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        # Cleanup IoT components
        sensor_network.shutdown()
        print("Server shutdown complete")
