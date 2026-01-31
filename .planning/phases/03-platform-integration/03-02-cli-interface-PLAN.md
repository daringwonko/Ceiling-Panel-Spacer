---
phase: 03-platform-integration
plan: 02
type: execute
wave: 1
depends_on: ["03-01"]
files_modified: 
  - savage_cli.py
  - Savage_Cabinetry_Platform/cli_interface.py
autonomous: true
must_haves:
  truths:
    - User can run kitchen design commands from command line
    - CLI provides intuitive interface to orchestrator
    - Commands accept parameters and produce results
  artifacts:
    - path: "savage_cli.py"
      provides: "Main CLI entry point for the platform"
      min_lines: 50
    - path: "Savage_Cabinetry_Platform/cli_interface.py"
      provides: "CLI command processing and result formatting"
      exports: ["CLIInterface"]
  key_links:
    - from: "savage_cli.py"
      to: "Savage_Cabinetry_Platform.kitchen_orchestrator"
      via: "from Savage_Cabinetry_Platform.kitchen_orchestrator import KitchenDesignOrchestrator"
      pattern: "from.*kitchen_orchestrator.*import"
    - from: "Savage_Cabinetry_Platform/cli_interface.py"
      to: "savage_cli.py"
      via: "import savage_cli"
      pattern: "import.*cli"
---

<objective>
Implement command-line interface for the Savage Cabinetry platform providing easy access to all design features.

Purpose: Create user-friendly CLI that allows designers to interact with the kitchen design system from terminal.
Output: Working CLI tool ready for immediate use with comprehensive command set.
</objective>

<execution_context>
@/home/tomas/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/tomas/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-platform-integration/03-01-kitchen-orchestrator-PLAN.md
@ceiling_project_analysis_report.md
@GUI_README.md
@QUIck_START.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CLI Interface Module</name>
  <files>Savage_Cabinetry_Platform/cli_interface.py</files>
  <action>Create CLIInterface class with:
  - Command parsing and validation
  - Integration with KitchenDesignOrchestrator
  - Result formatting and display
  - Error handling with user-friendly messages</action>
  <verify>python -c "from Savage_Cabinetry_Platform.cli_interface import CLIInterface; cli = CLIInterface(); print('CLI interface initialized')"</verify>
  <done>CLIInterface class can be imported and instantiated</done>
</task>

<task type="auto">
  <name>Task 2: Implement Design Commands</name>
  <files>Savage_Cabinetry_Platform/cli_interface.py</files>
  <action>Add core CLI commands:
  - calculate: Process ceiling panel calculations
  - estimate: Get cost estimates
  - export: Generate export files (DXF, SVG, JSON, Report)
  - status: Show current design state
  - help: Display command usage information</action>
  <verify>python -c "from Savage_Cabinetry_Platform.cli_interface import CLIInterface; cli = CLIInterface(); print('Available commands:', [m for m in dir(cli) if not m.startswith('_') and 'command' in m])"</verify>
  <done>Core CLI commands are implemented and accessible</done>
</task>

<task type="auto">
  <name>Task 3: Create Main CLI Entry Point</name>
  <files>savage_cli.py</files>
  <action>Create main CLI script that:
  - Parses command line arguments
  - Initializes CLIInterface
  - Routes commands to appropriate handlers
  - Provides usage information and help
  - Handles top-level command line interface</action>
  <verify>python savage_cli.py --help 2>/dev/null | head -5</verify>
  <done>Main CLI script runs and shows help information</done>
</task>

<task type="auto">
  <name>Task 4: Test Basic CLI Operations</name>
  <files>savage_cli.py</files>
  <action>Test basic CLI functionality:
  - Initialize without errors
  - Show help/usage
  - Handle invalid commands gracefully
  - Processsample calculation commands</action>
  <verify>python savage_cli.py | grep -E "(Savage|help|usage|command)" | wc -l</verify>
  <done>CLI responds to commands appropriately</done>
</task>

</tasks>

<verification>
Run CLI with different commands to verify functionality
</verification>

<success_criteria>
- CLI can be invoked from command line
- Help system works
- Basic commands execute without errors
- Integration with orchestrator functions properly
- Platform appears as main application entry point
</success_criteria>

<output>
After completion, create .planning/phases/03-platform-integration/03-02-SUMMARY.md
</output>