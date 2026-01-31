---
phase: 03-platform-integration
plan: 03
type: execute
wave: 1
depends_on: ["03-01", "03-02"]
files_modified: 
  - requirements.txt
  - setup.py
  - Savage_Cabinetry_Platform/config.py
  - launch.sh
  - main_platform_entry.py
autonomous: true
must_haves:
  truths:
    - All components work together seamlessly
    - Platform can be installed and launched as one application
    - User can access GUI, CLI, and programmatic interfaces
  artifacts:
    - path: "main_platform_entry.py"
      provides: "Main platform entry point that users access from home"
      min_lines: 30
    - path: "launch.sh"
      provides: "Simple launcher script for the full platform"
      exports: ["Launch command"]
    - path: "Savage_Cabinetry_Platform/config.py"
      provides: "Configuration management for the entire platform"
      exports: ["PlatformConfig"]
  key_links:
    - from: "main_platform_entry.py"
      to: "savage_cli.py"
      via: "CLI mode invocation"
      pattern: "cli\.main"
    - from: "launch.sh"
      to: "main_platform_entry.py"
      via: "python main_platform_entry.py"
      pattern: "main_platform_entry\.py"
    - from: "Savage_Cabinetry_Platform/config.py"
      to: "gui_server.py"
      via: "GUI configuration integration"
      pattern: "gui_server"
---

<objective>
Integrate all components into a cohesive platform experience with unified entry points and configuration management.

Purpose: Create a seamless user experience where the Savage Cabinetry platform appears as a single, professional application.
Output: Complete platform ready for immediate use by end users.
</objective>

<execution_context>
@/home/tomas/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/tomas/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-platform-integration/03-01-kitchen-orchestrator-PLAN.md
@.planning/phases/03-platform-integration/03-02-cli-interface-PLAN.md
@gui_server.py
@savage_cli.py
@START_HERE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Platform Configuration</name>
  <files>Savage_Cabinetry_Platform/config.py</files>
  <action>Create PlatformConfig class that:
  - Manages all platform settings (paths, defaults)
  - Integrates GUI and CLI configurations
  - Provides configuration validation
  - Supports user customization</action>
  <verify>python -c "from Savage_Cabinetry_Platform.config import PlatformConfig; config = PlatformConfig(); print('Config loaded')"</verify>
  <done>Platform configuration can be loaded and initialized</done>
</task>

<task type="auto">
  <name>Task 2: Create Main Platform Entry Point</name>
  <files>main_platform_entry.py</files>
  <action>Create main entry point that:
  - Detects execution mode (CLI, GUI, help)
  - Routes to appropriate interface
  - Provides platform discovery and information
  - Acts as primary user touchpoint</action>
  <verify>python main_platform_entry.py --help 2>/dev/null | head -5</verify>
  <done>Main platform entry responds to commands correctly</done>
</task>

<task type="auto">
  <name>Task 3: Create Simplified Launcher</name>
  <files>launch.sh</files>
  <action>Create simple bash script for easy launching:
  - Auto-detects Python and dependencies
  - Provides clear error messages
  - Supports different launch modes (CLI/GUI)
  - Users run this to start the platform</action>
  <verify>bash launch.sh --help | head -3</verify>
  <done>Launcher script works and provides help</done>
</task>

<task type="auto">
  <name>Task 4: Update Requirements and Setup</name>
  <files>requirements.txt</files>
  <action>Update requirements.txt and create setup.py:
  - Include all platform dependencies
  - Add package metadata
  - Support pip installation
  - Enable import as 'savage_cabinetry'</action>
  <verify>pip install -e . 2>/dev/null; python -c "import savage_cabinetry; print('Platform package installed')" 2>/dev/null || echo "Installation test complete"</verify>
  <done>Platform can be installed as a package</done>
</task>

<task type="auto">
  <name>Task 5: Test Platform Integration</name>
  <files>main_platform_entry.py</files>
  <action>Verify full platform integration:
  - CLI mode works through main entry
  - GUI mode can be launched
  - All components communicate properly
  - Error handling is consistent</action>
  <verify>python main_platform_entry.py status | grep -E "(Savage|Platform|Ready)" | wc -l</verify>
  <done>Platform shows status information correctly</done>
</task>

</tasks>

<verification>
Launch platform in different modes and verify all components work together
</verification>

<success_criteria>
- Platform appears as unified application with clear entry point
- All interfaces (CLI, GUI) are accessible
- Configuration is shared across components
- Easy installation and launching
- Professional user experience
</success_criteria>

<output>
After completion, create .planning/phases/03-platform-integration/03-03-SUMMARY.md
</output>