#!/usr/bin/env python3
"""
Build Script with Performance Metrics
Tracks build performance and logs important metrics
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sergik_ml.core.dev_config import (
    get_dev_config, 
    track_build_start, 
    track_build_end,
    log_build_metric,
    log_performance
)


def run_command(cmd: list, cwd: Optional[Path] = None) -> tuple[int, str, str]:
    """Run a command and return exit code, stdout, stderr."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)


def build_python() -> Dict[str, Any]:
    """Build Python components with metrics."""
    start_time = time.time()
    metrics = {
        "type": "python",
        "start_time": start_time,
        "errors": [],
        "warnings": []
    }
    
    dev_config = get_dev_config()
    
    # Run type checking if enabled
    if dev_config.enable_type_checking:
        log_build_metric("type_check_start", time.time())
        exit_code, stdout, stderr = run_command([
            sys.executable, "-m", "mypy", "sergik_ml", "sergik_ai_team"
        ])
        if exit_code != 0:
            metrics["warnings"].append("Type checking found issues")
        log_build_metric("type_check_duration", time.time() - start_time, "seconds")
    
    # Run linting if enabled
    if dev_config.enable_linting:
        log_build_metric("lint_start", time.time())
        exit_code, stdout, stderr = run_command([
            sys.executable, "-m", "pylint", "sergik_ml", "sergik_ai_team"
        ])
        if exit_code != 0:
            metrics["warnings"].append("Linting found issues")
        log_build_metric("lint_duration", time.time() - start_time, "seconds")
    
    # Run tests if enabled
    if dev_config.enable_test_coverage:
        log_build_metric("test_start", time.time())
        exit_code, stdout, stderr = run_command([
            sys.executable, "-m", "pytest", "--cov=sergik_ml", "--cov-report=html"
        ])
        if exit_code != 0:
            metrics["errors"].append("Tests failed")
        log_build_metric("test_duration", time.time() - start_time, "seconds")
    
    metrics["duration"] = time.time() - start_time
    metrics["end_time"] = time.time()
    
    return metrics


def build_js(project_dir: Path) -> Dict[str, Any]:
    """Build JavaScript/TypeScript components with metrics."""
    start_time = time.time()
    metrics = {
        "type": "javascript",
        "project": project_dir.name,
        "start_time": start_time,
        "errors": [],
        "warnings": []
    }
    
    dev_config = get_dev_config()
    
    # Check if package.json exists
    package_json = project_dir / "package.json"
    if not package_json.exists():
        metrics["warnings"].append("No package.json found, skipping")
        return metrics
    
    # Run npm install if node_modules doesn't exist
    node_modules = project_dir / "node_modules"
    if not node_modules.exists():
        log_build_metric("npm_install_start", time.time())
        exit_code, stdout, stderr = run_command(["npm", "install"], cwd=project_dir)
        if exit_code != 0:
            metrics["errors"].append("npm install failed")
            return metrics
        log_build_metric("npm_install_duration", time.time() - start_time, "seconds")
    
    # Run type checking if enabled
    if dev_config.enable_type_checking:
        log_build_metric("ts_check_start", time.time())
        exit_code, stdout, stderr = run_command(["npm", "run", "type-check"], cwd=project_dir)
        if exit_code != 0:
            metrics["warnings"].append("TypeScript type checking found issues")
        log_build_metric("ts_check_duration", time.time() - start_time, "seconds")
    
    # Run linting if enabled
    if dev_config.enable_linting:
        log_build_metric("js_lint_start", time.time())
        exit_code, stdout, stderr = run_command(["npm", "run", "lint"], cwd=project_dir)
        if exit_code != 0:
            metrics["warnings"].append("Linting found issues")
        log_build_metric("js_lint_duration", time.time() - start_time, "seconds")
    
    # Run build
    log_build_metric("build_start", time.time())
    exit_code, stdout, stderr = run_command(["npm", "run", "build"], cwd=project_dir)
    if exit_code != 0:
        metrics["errors"].append("Build failed")
        print(stderr, file=sys.stderr)
    log_build_metric("build_duration", time.time() - start_time, "seconds")
    
    # Run tests if enabled
    if dev_config.enable_test_coverage:
        log_build_metric("js_test_start", time.time())
        exit_code, stdout, stderr = run_command(["npm", "test"], cwd=project_dir)
        if exit_code != 0:
            metrics["warnings"].append("Tests had failures")
        log_build_metric("js_test_duration", time.time() - start_time, "seconds")
    
    metrics["duration"] = time.time() - start_time
    metrics["end_time"] = time.time()
    
    return metrics


def main():
    """Main build function."""
    print("=" * 80)
    print("SERGIK Build System with Performance Metrics")
    print("=" * 80)
    print()
    
    # Initialize dev config
    dev_config = get_dev_config()
    track_build_start()
    
    all_metrics = []
    total_start = time.time()
    
    # Build Python components
    print("Building Python components...")
    python_metrics = build_python()
    all_metrics.append(python_metrics)
    log_performance("python_build", python_metrics["duration"])
    
    # Build JavaScript components
    base_dir = Path(__file__).parent.parent
    
    # Max for Live project
    m4l_dir = base_dir / "maxforlive"
    if m4l_dir.exists():
        print(f"\nBuilding Max for Live project...")
        m4l_metrics = build_js(m4l_dir)
        all_metrics.append(m4l_metrics)
        log_performance("m4l_build", m4l_metrics["duration"])
    
    # Controller app
    controller_dir = base_dir / "sergik_controller_app"
    if controller_dir.exists() and (controller_dir / "package.json").exists():
        print(f"\nBuilding Controller App...")
        controller_metrics = build_js(controller_dir)
        all_metrics.append(controller_metrics)
        log_performance("controller_build", controller_metrics["duration"])
    
    # Calculate totals
    total_duration = time.time() - total_start
    total_errors = sum(len(m.get("errors", [])) for m in all_metrics)
    total_warnings = sum(len(m.get("warnings", [])) for m in all_metrics)
    
    # Track build end
    dev_config.build_metrics.files_processed = len(all_metrics)
    dev_config.build_metrics.errors = [e for m in all_metrics for e in m.get("errors", [])]
    dev_config.build_metrics.warnings = [w for m in all_metrics for w in m.get("warnings", [])]
    track_build_end()
    
    # Print summary
    print()
    print("=" * 80)
    print("Build Summary")
    print("=" * 80)
    print(f"Total Duration: {total_duration:.2f}s")
    print(f"Components Built: {len(all_metrics)}")
    print(f"Errors: {total_errors}")
    print(f"Warnings: {total_warnings}")
    print()
    
    for metrics in all_metrics:
        print(f"  {metrics.get('type', 'unknown')} ({metrics.get('project', 'main')}): "
              f"{metrics.get('duration', 0):.2f}s")
        if metrics.get("errors"):
            for error in metrics["errors"]:
                print(f"    ❌ {error}")
        if metrics.get("warnings"):
            for warning in metrics["warnings"]:
                print(f"    ⚠️  {warning}")
    
    print()
    print("=" * 80)
    
    # Save metrics to file
    metrics_file = base_dir / ".build_metrics.json"
    with open(metrics_file, 'w') as f:
        json.dump({
            "timestamp": time.time(),
            "total_duration": total_duration,
            "metrics": all_metrics
        }, f, indent=2)
    
    print(f"Build metrics saved to: {metrics_file}")
    
    # Exit with error code if there were errors
    sys.exit(1 if total_errors > 0 else 0)


if __name__ == "__main__":
    main()

