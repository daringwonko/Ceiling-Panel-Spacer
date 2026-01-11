#!/usr/bin/env python3
"""
System Orchestrator for Ceiling Panel Calculator.

Central coordination layer that:
- Manages component lifecycle
- Orchestrates workflows
- Handles inter-component communication
- Provides unified API
- Monitors system health
"""

import time
import json
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable, Type
from datetime import datetime
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, Future
import threading


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComponentStatus(Enum):
    """Component status states."""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    STOPPED = "stopped"


class WorkflowStatus(Enum):
    """Workflow execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ComponentInfo:
    """Information about a registered component."""
    name: str
    component_type: str
    instance: Any
    status: ComponentStatus = ComponentStatus.UNINITIALIZED
    dependencies: List[str] = field(default_factory=list)
    last_health_check: Optional[datetime] = None
    error_message: Optional[str] = None


@dataclass
class WorkflowStep:
    """Single step in a workflow."""
    name: str
    component: str
    method: str
    params: Dict[str, Any] = field(default_factory=dict)
    depends_on: List[str] = field(default_factory=list)
    timeout_seconds: int = 300
    retry_count: int = 0


@dataclass
class WorkflowDefinition:
    """Definition of a workflow."""
    name: str
    description: str
    steps: List[WorkflowStep]
    on_success: Optional[Callable] = None
    on_failure: Optional[Callable] = None


@dataclass
class WorkflowExecution:
    """Execution instance of a workflow."""
    execution_id: str
    workflow_name: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    step_results: Dict[str, Any] = field(default_factory=dict)
    current_step: Optional[str] = None
    error: Optional[str] = None


class SystemOrchestrator:
    """
    Central orchestrator for all system components.

    Provides:
    - Component registration and lifecycle management
    - Workflow definition and execution
    - Inter-component communication
    - Health monitoring
    - Unified system API
    """

    def __init__(self):
        self.components: Dict[str, ComponentInfo] = {}
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self.executions: Dict[str, WorkflowExecution] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self._lock = threading.Lock()
        self._execution_counter = 0
        self._running = False

        # Register standard workflows
        self._register_standard_workflows()

    def register_component(
        self,
        name: str,
        component_type: str,
        instance: Any,
        dependencies: Optional[List[str]] = None
    ) -> None:
        """Register a system component."""
        with self._lock:
            self.components[name] = ComponentInfo(
                name=name,
                component_type=component_type,
                instance=instance,
                dependencies=dependencies or []
            )
        logger.info(f"Registered component: {name} ({component_type})")

    def initialize_component(self, name: str) -> bool:
        """Initialize a single component."""
        if name not in self.components:
            logger.error(f"Component not found: {name}")
            return False

        comp = self.components[name]

        # Check dependencies
        for dep in comp.dependencies:
            if dep not in self.components:
                logger.error(f"Missing dependency {dep} for {name}")
                return False
            if self.components[dep].status != ComponentStatus.READY:
                logger.warning(f"Dependency {dep} not ready, initializing...")
                self.initialize_component(dep)

        # Initialize
        comp.status = ComponentStatus.INITIALIZING
        try:
            if hasattr(comp.instance, 'initialize'):
                comp.instance.initialize()
            comp.status = ComponentStatus.READY
            comp.last_health_check = datetime.now()
            logger.info(f"Initialized component: {name}")
            return True
        except Exception as e:
            comp.status = ComponentStatus.ERROR
            comp.error_message = str(e)
            logger.error(f"Failed to initialize {name}: {e}")
            return False

    def initialize_all(self) -> Dict[str, bool]:
        """Initialize all registered components."""
        results = {}

        # Sort by dependencies
        sorted_components = self._topological_sort()

        for name in sorted_components:
            results[name] = self.initialize_component(name)

        return results

    def _topological_sort(self) -> List[str]:
        """Sort components by dependencies."""
        visited = set()
        result = []

        def visit(name):
            if name in visited:
                return
            visited.add(name)

            comp = self.components.get(name)
            if comp:
                for dep in comp.dependencies:
                    visit(dep)

            result.append(name)

        for name in self.components:
            visit(name)

        return result

    def get_component(self, name: str) -> Optional[Any]:
        """Get a component instance."""
        comp = self.components.get(name)
        return comp.instance if comp else None

    def call_component(
        self,
        component_name: str,
        method_name: str,
        *args,
        **kwargs
    ) -> Any:
        """Call a method on a component."""
        comp = self.components.get(component_name)
        if not comp:
            raise ValueError(f"Component not found: {component_name}")

        if comp.status not in [ComponentStatus.READY, ComponentStatus.RUNNING]:
            raise RuntimeError(f"Component {component_name} not ready")

        method = getattr(comp.instance, method_name, None)
        if not method:
            raise AttributeError(f"Method {method_name} not found on {component_name}")

        return method(*args, **kwargs)

    def register_workflow(self, workflow: WorkflowDefinition) -> None:
        """Register a workflow definition."""
        self.workflows[workflow.name] = workflow
        logger.info(f"Registered workflow: {workflow.name}")

    def execute_workflow(
        self,
        workflow_name: str,
        params: Optional[Dict[str, Any]] = None,
        async_execution: bool = False
    ) -> WorkflowExecution:
        """Execute a workflow."""
        if workflow_name not in self.workflows:
            raise ValueError(f"Workflow not found: {workflow_name}")

        workflow = self.workflows[workflow_name]

        # Create execution
        with self._lock:
            self._execution_counter += 1
            exec_id = f"EXEC-{self._execution_counter:06d}"

        execution = WorkflowExecution(
            execution_id=exec_id,
            workflow_name=workflow_name,
            start_time=datetime.now()
        )
        self.executions[exec_id] = execution

        if async_execution:
            self.executor.submit(self._run_workflow, workflow, execution, params or {})
        else:
            self._run_workflow(workflow, execution, params or {})

        return execution

    def _run_workflow(
        self,
        workflow: WorkflowDefinition,
        execution: WorkflowExecution,
        params: Dict[str, Any]
    ) -> None:
        """Run a workflow."""
        execution.status = WorkflowStatus.RUNNING
        logger.info(f"Starting workflow: {workflow.name} ({execution.execution_id})")

        try:
            for step in workflow.steps:
                execution.current_step = step.name

                # Check dependencies
                for dep in step.depends_on:
                    if dep not in execution.step_results:
                        raise RuntimeError(f"Step dependency not met: {dep}")

                # Merge params
                step_params = {**params, **step.params}
                for dep in step.depends_on:
                    step_params[f"{dep}_result"] = execution.step_results[dep]

                # Execute step
                logger.info(f"  Executing step: {step.name}")
                result = self.call_component(
                    step.component,
                    step.method,
                    **step_params
                )

                execution.step_results[step.name] = result

            execution.status = WorkflowStatus.COMPLETED
            execution.end_time = datetime.now()
            logger.info(f"Workflow completed: {workflow.name}")

            if workflow.on_success:
                workflow.on_success(execution)

        except Exception as e:
            execution.status = WorkflowStatus.FAILED
            execution.error = str(e)
            execution.end_time = datetime.now()
            logger.error(f"Workflow failed: {workflow.name} - {e}")

            if workflow.on_failure:
                workflow.on_failure(execution, e)

    def get_execution_status(self, execution_id: str) -> Optional[WorkflowExecution]:
        """Get workflow execution status."""
        return self.executions.get(execution_id)

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status."""
        component_statuses = {
            name: comp.status.value
            for name, comp in self.components.items()
        }

        ready_count = sum(1 for c in self.components.values()
                        if c.status == ComponentStatus.READY)
        error_count = sum(1 for c in self.components.values()
                        if c.status == ComponentStatus.ERROR)

        active_executions = sum(1 for e in self.executions.values()
                               if e.status == WorkflowStatus.RUNNING)

        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy' if error_count == 0 else 'degraded',
            'components': {
                'total': len(self.components),
                'ready': ready_count,
                'error': error_count,
                'statuses': component_statuses
            },
            'workflows': {
                'registered': len(self.workflows),
                'active_executions': active_executions,
                'total_executions': len(self.executions)
            }
        }

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all components."""
        results = {}

        for name, comp in self.components.items():
            try:
                if hasattr(comp.instance, 'health_check'):
                    health = comp.instance.health_check()
                else:
                    health = {'status': 'ok'}

                results[name] = {
                    'status': 'healthy',
                    'details': health
                }
                comp.last_health_check = datetime.now()
            except Exception as e:
                results[name] = {
                    'status': 'unhealthy',
                    'error': str(e)
                }

        return results

    def _register_standard_workflows(self) -> None:
        """Register standard system workflows."""
        # Full calculation workflow
        self.register_workflow(WorkflowDefinition(
            name="full_calculation",
            description="Complete ceiling panel calculation workflow",
            steps=[
                WorkflowStep(
                    name="validate",
                    component="validator",
                    method="validate_input"
                ),
                WorkflowStep(
                    name="calculate",
                    component="calculator",
                    method="calculate",
                    depends_on=["validate"]
                ),
                WorkflowStep(
                    name="optimize",
                    component="optimizer",
                    method="optimize",
                    depends_on=["calculate"]
                ),
                WorkflowStep(
                    name="export",
                    component="exporter",
                    method="export_all",
                    depends_on=["optimize"]
                )
            ]
        ))

        # Health check workflow
        self.register_workflow(WorkflowDefinition(
            name="system_health_check",
            description="Complete system health check",
            steps=[
                WorkflowStep(
                    name="check_components",
                    component="orchestrator",
                    method="health_check"
                )
            ]
        ))

    def shutdown(self) -> None:
        """Gracefully shutdown the orchestrator."""
        logger.info("Shutting down orchestrator...")

        # Stop all components
        for name, comp in self.components.items():
            if hasattr(comp.instance, 'shutdown'):
                try:
                    comp.instance.shutdown()
                except Exception as e:
                    logger.error(f"Error shutting down {name}: {e}")
            comp.status = ComponentStatus.STOPPED

        # Shutdown executor
        self.executor.shutdown(wait=True)
        logger.info("Orchestrator shutdown complete")


# Mock components for demonstration
class MockCalculator:
    def calculate(self, **kwargs):
        return {"layout": "3x3", "panels": 9}


class MockValidator:
    def validate_input(self, **kwargs):
        return {"valid": True}


class MockOptimizer:
    def optimize(self, **kwargs):
        return {"optimized": True, "improvement": 15}


class MockExporter:
    def export_all(self, **kwargs):
        return {"files": ["output.dxf", "output.svg"]}


def demonstrate_orchestrator():
    """Demonstrate system orchestrator."""
    print("="*80)
    print("SYSTEM ORCHESTRATOR")
    print("="*80)

    orchestrator = SystemOrchestrator()

    # Register components
    print("\n1. Registering Components...")
    orchestrator.register_component("validator", "input_validation", MockValidator())
    orchestrator.register_component("calculator", "core_calculation", MockCalculator(),
                                   dependencies=["validator"])
    orchestrator.register_component("optimizer", "optimization", MockOptimizer(),
                                   dependencies=["calculator"])
    orchestrator.register_component("exporter", "file_export", MockExporter(),
                                   dependencies=["optimizer"])

    print(f"  Registered {len(orchestrator.components)} components")

    # Initialize all
    print("\n2. Initializing Components...")
    results = orchestrator.initialize_all()
    for name, success in results.items():
        status = "✓" if success else "✗"
        print(f"  {status} {name}")

    # Check system status
    print("\n3. System Status:")
    status = orchestrator.get_system_status()
    print(f"  Overall: {status['overall_status']}")
    print(f"  Components: {status['components']['ready']}/{status['components']['total']} ready")
    print(f"  Workflows: {status['workflows']['registered']} registered")

    # Execute workflow
    print("\n4. Executing Workflow: full_calculation")
    execution = orchestrator.execute_workflow("full_calculation", {
        "length": 5000,
        "width": 4000
    })

    print(f"  Execution ID: {execution.execution_id}")
    print(f"  Status: {execution.status.value}")

    if execution.status == WorkflowStatus.COMPLETED:
        print("  Step Results:")
        for step, result in execution.step_results.items():
            print(f"    - {step}: {result}")
    elif execution.status == WorkflowStatus.FAILED:
        print(f"  Error: {execution.error}")

    # Health check
    print("\n5. Health Check:")
    health = orchestrator.health_check()
    for comp, result in health.items():
        print(f"  {comp}: {result['status']}")

    # Shutdown
    print("\n6. Shutdown...")
    orchestrator.shutdown()
    print("  ✓ Orchestrator shutdown complete")

    print("\n" + "="*80)
    print("ORCHESTRATOR DEMONSTRATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_orchestrator()
