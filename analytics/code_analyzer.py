#!/usr/bin/env python3
"""
AI Code Analyzer for Ceiling Panel Calculator.

Provides real code analysis using AST parsing:
- Code quality metrics
- Complexity analysis
- Security vulnerability detection
- Style checking
- Pattern recognition
- Improvement suggestions
"""

import ast
import os
import re
import sys
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
from pathlib import Path
from collections import defaultdict
import json


@dataclass
class CodeIssue:
    """Represents a code issue found during analysis."""
    severity: str  # 'critical', 'warning', 'info'
    category: str  # 'security', 'quality', 'style', 'performance'
    message: str
    file_path: str
    line_number: int
    code_snippet: str = ""
    suggestion: str = ""


@dataclass
class FunctionMetrics:
    """Metrics for a single function."""
    name: str
    line_number: int
    lines_of_code: int
    cyclomatic_complexity: int
    parameter_count: int
    return_count: int
    has_docstring: bool
    nested_depth: int


@dataclass
class ClassMetrics:
    """Metrics for a single class."""
    name: str
    line_number: int
    method_count: int
    attribute_count: int
    inheritance_depth: int
    has_docstring: bool
    methods: List[FunctionMetrics] = field(default_factory=list)


@dataclass
class FileMetrics:
    """Metrics for a single file."""
    file_path: str
    lines_of_code: int
    blank_lines: int
    comment_lines: int
    import_count: int
    function_count: int
    class_count: int
    average_complexity: float
    max_complexity: int
    functions: List[FunctionMetrics] = field(default_factory=list)
    classes: List[ClassMetrics] = field(default_factory=list)


@dataclass
class AnalysisReport:
    """Complete analysis report."""
    timestamp: str
    files_analyzed: int
    total_issues: int
    critical_issues: int
    warnings: int
    info: int
    issues: List[CodeIssue] = field(default_factory=list)
    metrics: List[FileMetrics] = field(default_factory=list)
    summary: Dict[str, Any] = field(default_factory=dict)


class ComplexityVisitor(ast.NodeVisitor):
    """AST visitor to calculate cyclomatic complexity."""

    def __init__(self):
        self.complexity = 1  # Start at 1
        self.nested_depth = 0
        self.max_nested_depth = 0

    def visit_If(self, node):
        self.complexity += 1
        self._enter_nested()
        self.generic_visit(node)
        self._exit_nested()

    def visit_For(self, node):
        self.complexity += 1
        self._enter_nested()
        self.generic_visit(node)
        self._exit_nested()

    def visit_While(self, node):
        self.complexity += 1
        self._enter_nested()
        self.generic_visit(node)
        self._exit_nested()

    def visit_ExceptHandler(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_With(self, node):
        self.complexity += 1
        self._enter_nested()
        self.generic_visit(node)
        self._exit_nested()

    def visit_BoolOp(self, node):
        # Each 'and'/'or' adds to complexity
        self.complexity += len(node.values) - 1
        self.generic_visit(node)

    def visit_comprehension(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def _enter_nested(self):
        self.nested_depth += 1
        self.max_nested_depth = max(self.max_nested_depth, self.nested_depth)

    def _exit_nested(self):
        self.nested_depth -= 1


class SecurityAnalyzer:
    """Analyzes code for security vulnerabilities."""

    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        (r'eval\s*\(', 'eval() is dangerous - can execute arbitrary code'),
        (r'exec\s*\(', 'exec() is dangerous - can execute arbitrary code'),
        (r'__import__\s*\(', 'Dynamic import can be dangerous'),
        (r'subprocess\.call\s*\(.*shell\s*=\s*True', 'Shell injection risk'),
        (r'os\.system\s*\(', 'os.system() can be vulnerable to injection'),
        (r'pickle\.loads?\s*\(', 'Pickle can deserialize malicious code'),
        (r'yaml\.load\s*\([^,]*\)', 'yaml.load without Loader is unsafe'),
        (r'input\s*\(', 'input() in Python 2 executes code - verify Python 3'),
    ]

    # SQL injection patterns
    SQL_PATTERNS = [
        (r'execute\s*\(\s*["\'].*%s', 'Possible SQL injection - use parameterized queries'),
        (r'execute\s*\(\s*f["\']', 'f-string in SQL query - use parameterized queries'),
        (r'execute\s*\(\s*["\'].*\+', 'String concatenation in SQL - use parameterized queries'),
    ]

    # Hardcoded secrets
    SECRET_PATTERNS = [
        (r'password\s*=\s*["\'][^"\']+["\']', 'Possible hardcoded password'),
        (r'api_key\s*=\s*["\'][^"\']+["\']', 'Possible hardcoded API key'),
        (r'secret\s*=\s*["\'][^"\']+["\']', 'Possible hardcoded secret'),
        (r'token\s*=\s*["\'][A-Za-z0-9]{20,}["\']', 'Possible hardcoded token'),
    ]

    def analyze(self, code: str, file_path: str) -> List[CodeIssue]:
        """Analyze code for security issues."""
        issues = []
        lines = code.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Check dangerous patterns
            for pattern, message in self.DANGEROUS_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append(CodeIssue(
                        severity='critical',
                        category='security',
                        message=message,
                        file_path=file_path,
                        line_number=line_num,
                        code_snippet=line.strip(),
                        suggestion='Review this line for security implications'
                    ))

            # Check SQL patterns
            for pattern, message in self.SQL_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append(CodeIssue(
                        severity='critical',
                        category='security',
                        message=message,
                        file_path=file_path,
                        line_number=line_num,
                        code_snippet=line.strip(),
                        suggestion='Use parameterized queries instead'
                    ))

            # Check secret patterns
            for pattern, message in self.SECRET_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append(CodeIssue(
                        severity='warning',
                        category='security',
                        message=message,
                        file_path=file_path,
                        line_number=line_num,
                        code_snippet=line.strip()[:50] + '...',
                        suggestion='Use environment variables for secrets'
                    ))

        return issues


class StyleAnalyzer:
    """Analyzes code style issues."""

    def analyze(self, code: str, file_path: str) -> List[CodeIssue]:
        """Analyze code style issues."""
        issues = []
        lines = code.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Line length
            if len(line) > 120:
                issues.append(CodeIssue(
                    severity='info',
                    category='style',
                    message=f'Line too long ({len(line)} > 120 characters)',
                    file_path=file_path,
                    line_number=line_num,
                    code_snippet=line[:80] + '...',
                    suggestion='Break line into multiple lines'
                ))

            # Trailing whitespace
            if line != line.rstrip():
                issues.append(CodeIssue(
                    severity='info',
                    category='style',
                    message='Trailing whitespace',
                    file_path=file_path,
                    line_number=line_num,
                    code_snippet=line.strip()[:50]
                ))

            # Mixed indentation
            if line and line[0] in ' \t':
                if ' \t' in line[:len(line) - len(line.lstrip())]:
                    issues.append(CodeIssue(
                        severity='warning',
                        category='style',
                        message='Mixed tabs and spaces in indentation',
                        file_path=file_path,
                        line_number=line_num,
                        suggestion='Use consistent indentation (prefer spaces)'
                    ))

        return issues


class CodeAnalyzer:
    """
    Main code analyzer combining all analysis capabilities.
    """

    def __init__(self):
        self.security_analyzer = SecurityAnalyzer()
        self.style_analyzer = StyleAnalyzer()

    def analyze_file(self, file_path: str) -> Tuple[FileMetrics, List[CodeIssue]]:
        """Analyze a single Python file."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            code = f.read()

        issues = []
        metrics = self._compute_metrics(code, file_path)

        # Security analysis
        issues.extend(self.security_analyzer.analyze(code, file_path))

        # Style analysis
        issues.extend(self.style_analyzer.analyze(code, file_path))

        # Quality issues from metrics
        issues.extend(self._quality_issues_from_metrics(metrics))

        return metrics, issues

    def _compute_metrics(self, code: str, file_path: str) -> FileMetrics:
        """Compute code metrics from source."""
        lines = code.split('\n')

        # Basic counts
        loc = len([l for l in lines if l.strip()])
        blank = len([l for l in lines if not l.strip()])
        comments = len([l for l in lines if l.strip().startswith('#')])

        # Parse AST
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return FileMetrics(
                file_path=file_path,
                lines_of_code=loc,
                blank_lines=blank,
                comment_lines=comments,
                import_count=0,
                function_count=0,
                class_count=0,
                average_complexity=0,
                max_complexity=0
            )

        # Count imports
        imports = sum(1 for node in ast.walk(tree)
                     if isinstance(node, (ast.Import, ast.ImportFrom)))

        # Analyze functions and classes
        functions = []
        classes = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_metrics = self._analyze_function(node, code)
                functions.append(func_metrics)

            elif isinstance(node, ast.ClassDef):
                class_metrics = self._analyze_class(node, code)
                classes.append(class_metrics)

        # Compute complexity stats
        complexities = [f.cyclomatic_complexity for f in functions]
        avg_complexity = sum(complexities) / len(complexities) if complexities else 0
        max_complexity = max(complexities) if complexities else 0

        return FileMetrics(
            file_path=file_path,
            lines_of_code=loc,
            blank_lines=blank,
            comment_lines=comments,
            import_count=imports,
            function_count=len(functions),
            class_count=len(classes),
            average_complexity=round(avg_complexity, 2),
            max_complexity=max_complexity,
            functions=functions,
            classes=classes
        )

    def _analyze_function(self, node: ast.FunctionDef, code: str) -> FunctionMetrics:
        """Analyze a function node."""
        # Calculate complexity
        visitor = ComplexityVisitor()
        visitor.visit(node)

        # Count returns
        returns = sum(1 for n in ast.walk(node) if isinstance(n, ast.Return))

        # Check docstring
        has_docstring = (
            node.body and
            isinstance(node.body[0], ast.Expr) and
            isinstance(node.body[0].value, (ast.Str, ast.Constant))
        )

        # Lines of code
        if hasattr(node, 'end_lineno'):
            loc = node.end_lineno - node.lineno + 1
        else:
            loc = len(ast.unparse(node).split('\n')) if hasattr(ast, 'unparse') else 10

        return FunctionMetrics(
            name=node.name,
            line_number=node.lineno,
            lines_of_code=loc,
            cyclomatic_complexity=visitor.complexity,
            parameter_count=len(node.args.args),
            return_count=returns,
            has_docstring=has_docstring,
            nested_depth=visitor.max_nested_depth
        )

    def _analyze_class(self, node: ast.ClassDef, code: str) -> ClassMetrics:
        """Analyze a class node."""
        methods = []

        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                methods.append(self._analyze_function(item, code))

        # Count attributes (assignments in __init__)
        attrs = 0
        for item in node.body:
            if isinstance(item, ast.FunctionDef) and item.name == '__init__':
                for stmt in ast.walk(item):
                    if isinstance(stmt, ast.Assign):
                        for target in stmt.targets:
                            if isinstance(target, ast.Attribute):
                                if isinstance(target.value, ast.Name) and target.value.id == 'self':
                                    attrs += 1

        # Inheritance depth (simplified)
        inherit_depth = len(node.bases)

        # Check docstring
        has_docstring = (
            node.body and
            isinstance(node.body[0], ast.Expr) and
            isinstance(node.body[0].value, (ast.Str, ast.Constant))
        )

        return ClassMetrics(
            name=node.name,
            line_number=node.lineno,
            method_count=len(methods),
            attribute_count=attrs,
            inheritance_depth=inherit_depth,
            has_docstring=has_docstring,
            methods=methods
        )

    def _quality_issues_from_metrics(self, metrics: FileMetrics) -> List[CodeIssue]:
        """Generate quality issues from metrics."""
        issues = []

        # High complexity functions
        for func in metrics.functions:
            if func.cyclomatic_complexity > 10:
                issues.append(CodeIssue(
                    severity='warning',
                    category='quality',
                    message=f'Function "{func.name}" has high complexity ({func.cyclomatic_complexity})',
                    file_path=metrics.file_path,
                    line_number=func.line_number,
                    suggestion='Consider breaking into smaller functions'
                ))

            # Missing docstring
            if not func.has_docstring and not func.name.startswith('_'):
                issues.append(CodeIssue(
                    severity='info',
                    category='quality',
                    message=f'Function "{func.name}" missing docstring',
                    file_path=metrics.file_path,
                    line_number=func.line_number,
                    suggestion='Add docstring describing function purpose'
                ))

            # Too many parameters
            if func.parameter_count > 7:
                issues.append(CodeIssue(
                    severity='warning',
                    category='quality',
                    message=f'Function "{func.name}" has too many parameters ({func.parameter_count})',
                    file_path=metrics.file_path,
                    line_number=func.line_number,
                    suggestion='Consider using a configuration object'
                ))

            # Deep nesting
            if func.nested_depth > 4:
                issues.append(CodeIssue(
                    severity='warning',
                    category='quality',
                    message=f'Function "{func.name}" has deep nesting ({func.nested_depth} levels)',
                    file_path=metrics.file_path,
                    line_number=func.line_number,
                    suggestion='Consider early returns or breaking into smaller functions'
                ))

        # Class issues
        for cls in metrics.classes:
            if not cls.has_docstring:
                issues.append(CodeIssue(
                    severity='info',
                    category='quality',
                    message=f'Class "{cls.name}" missing docstring',
                    file_path=metrics.file_path,
                    line_number=cls.line_number,
                    suggestion='Add docstring describing class purpose'
                ))

            if cls.method_count > 20:
                issues.append(CodeIssue(
                    severity='warning',
                    category='quality',
                    message=f'Class "{cls.name}" has too many methods ({cls.method_count})',
                    file_path=metrics.file_path,
                    line_number=cls.line_number,
                    suggestion='Consider splitting into multiple classes'
                ))

        return issues

    def analyze_directory(self, directory: str, pattern: str = "*.py") -> AnalysisReport:
        """Analyze all Python files in a directory."""
        from datetime import datetime
        import glob

        files = glob.glob(os.path.join(directory, "**", pattern), recursive=True)

        all_issues = []
        all_metrics = []

        for file_path in files:
            try:
                metrics, issues = self.analyze_file(file_path)
                all_metrics.append(metrics)
                all_issues.extend(issues)
            except Exception as e:
                all_issues.append(CodeIssue(
                    severity='warning',
                    category='quality',
                    message=f'Could not analyze file: {str(e)}',
                    file_path=file_path,
                    line_number=0
                ))

        # Count by severity
        critical = len([i for i in all_issues if i.severity == 'critical'])
        warnings = len([i for i in all_issues if i.severity == 'warning'])
        info = len([i for i in all_issues if i.severity == 'info'])

        # Summary statistics
        total_loc = sum(m.lines_of_code for m in all_metrics)
        total_functions = sum(m.function_count for m in all_metrics)
        total_classes = sum(m.class_count for m in all_metrics)
        avg_complexity = (
            sum(m.average_complexity * m.function_count for m in all_metrics) /
            total_functions if total_functions > 0 else 0
        )

        return AnalysisReport(
            timestamp=datetime.now().isoformat(),
            files_analyzed=len(files),
            total_issues=len(all_issues),
            critical_issues=critical,
            warnings=warnings,
            info=info,
            issues=all_issues,
            metrics=all_metrics,
            summary={
                'total_lines_of_code': total_loc,
                'total_functions': total_functions,
                'total_classes': total_classes,
                'average_complexity': round(avg_complexity, 2),
                'issues_per_kloc': round(len(all_issues) / (total_loc / 1000), 2) if total_loc > 0 else 0
            }
        )

    def generate_report(self, report: AnalysisReport, format: str = 'text') -> str:
        """Generate formatted report."""
        if format == 'json':
            return json.dumps({
                'timestamp': report.timestamp,
                'files_analyzed': report.files_analyzed,
                'summary': report.summary,
                'issue_counts': {
                    'critical': report.critical_issues,
                    'warning': report.warnings,
                    'info': report.info
                },
                'issues': [
                    {
                        'severity': i.severity,
                        'category': i.category,
                        'message': i.message,
                        'file': i.file_path,
                        'line': i.line_number,
                        'suggestion': i.suggestion
                    }
                    for i in report.issues
                ]
            }, indent=2)

        # Text format
        lines = [
            "=" * 80,
            "CODE ANALYSIS REPORT",
            "=" * 80,
            f"\nTimestamp: {report.timestamp}",
            f"Files Analyzed: {report.files_analyzed}",
            "",
            "SUMMARY",
            "-" * 40,
            f"Total Lines of Code: {report.summary.get('total_lines_of_code', 0)}",
            f"Total Functions: {report.summary.get('total_functions', 0)}",
            f"Total Classes: {report.summary.get('total_classes', 0)}",
            f"Average Complexity: {report.summary.get('average_complexity', 0)}",
            f"Issues per KLOC: {report.summary.get('issues_per_kloc', 0)}",
            "",
            "ISSUES",
            "-" * 40,
            f"Critical: {report.critical_issues}",
            f"Warnings: {report.warnings}",
            f"Info: {report.info}",
            ""
        ]

        # Group issues by severity
        for severity in ['critical', 'warning', 'info']:
            issues = [i for i in report.issues if i.severity == severity]
            if issues:
                lines.append(f"\n{severity.upper()} ISSUES ({len(issues)})")
                lines.append("-" * 40)
                for issue in issues[:20]:  # Limit output
                    lines.append(f"\n[{issue.category}] {issue.message}")
                    lines.append(f"  File: {issue.file_path}:{issue.line_number}")
                    if issue.suggestion:
                        lines.append(f"  Suggestion: {issue.suggestion}")

        lines.append("\n" + "=" * 80)
        return "\n".join(lines)


def demonstrate_code_analyzer():
    """Demonstrate code analysis capabilities."""
    print("="*80)
    print("AI CODE ANALYZER")
    print("="*80)

    analyzer = CodeAnalyzer()

    # Analyze current directory
    print("\nAnalyzing ceiling panel calculator codebase...")

    report = analyzer.analyze_directory(".", "*.py")

    # Print summary
    print(f"\nFiles Analyzed: {report.files_analyzed}")
    print(f"Total Lines of Code: {report.summary.get('total_lines_of_code', 0)}")
    print(f"Total Functions: {report.summary.get('total_functions', 0)}")
    print(f"Total Classes: {report.summary.get('total_classes', 0)}")

    print(f"\nIssues Found:")
    print(f"  Critical: {report.critical_issues}")
    print(f"  Warnings: {report.warnings}")
    print(f"  Info: {report.info}")

    # Show some critical issues
    critical = [i for i in report.issues if i.severity == 'critical']
    if critical:
        print(f"\nCritical Issues (showing first 5):")
        for issue in critical[:5]:
            print(f"  [{issue.category}] {issue.message}")
            print(f"    File: {issue.file_path}:{issue.line_number}")

    # Show top complex functions
    all_functions = []
    for m in report.metrics:
        all_functions.extend(m.functions)

    complex_funcs = sorted(all_functions, key=lambda f: f.cyclomatic_complexity, reverse=True)
    if complex_funcs:
        print(f"\nMost Complex Functions:")
        for func in complex_funcs[:5]:
            print(f"  {func.name}: complexity={func.cyclomatic_complexity}, "
                  f"params={func.parameter_count}, lines={func.lines_of_code}")

    print("\n" + "="*80)
    print("CODE ANALYSIS COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_code_analyzer()
