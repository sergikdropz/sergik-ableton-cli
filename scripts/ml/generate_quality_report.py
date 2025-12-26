#!/usr/bin/env python3
"""
SERGIK Data Quality Report Generator

Generates comprehensive HTML data quality report with:
- Missing data analysis
- Outlier detection
- Data distribution visualization
- Quality score
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from scripts.ml.validate_data import validate_all
from scripts.ml.analyze_database import analyze_tracks, analyze_actions, analyze_emotions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_html_report(validation_results: Dict[str, Any], analysis_results: Dict[str, Any], output_file: Path) -> None:
    """Generate HTML quality report."""
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>SERGIK ML Data Quality Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #555;
            margin-top: 30px;
        }}
        .score {{
            font-size: 48px;
            font-weight: bold;
            color: #4CAF50;
            text-align: center;
            margin: 20px 0;
        }}
        .section {{
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }}
        .issue {{
            padding: 10px;
            margin: 5px 0;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 3px;
        }}
        .error {{
            background: #f8d7da;
            border-left-color: #dc3545;
        }}
        .success {{
            background: #d4edda;
            border-left-color: #28a745;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: #4CAF50;
            color: white;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }}
        .stat-value {{
            font-size: 32px;
            font-weight: bold;
            color: #2e7d32;
        }}
        .stat-label {{
            color: #666;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>SERGIK ML Data Quality Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="score">
            {validation_results['summary']['data_quality_score']}/100
        </div>
        
        <h2>Summary Statistics</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">{analysis_results['tracks']['total_tracks']}</div>
                <div class="stat-label">Total Tracks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{analysis_results['tracks']['rated_tracks']}</div>
                <div class="stat-label">Rated Tracks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{analysis_results['tracks']['rated_percentage']:.1f}%</div>
                <div class="stat-label">Rating Coverage</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{analysis_results['actions']['total_actions']}</div>
                <div class="stat-label">Total Actions</div>
            </div>
        </div>
        
        <h2>Data Quality Issues</h2>
        <div class="section">
            <h3>Feature Range Issues</h3>
            <p>Total issues: {validation_results['feature_ranges']['total_issues']}</p>
            {"".join([f'<div class="issue">{issue["issue"]} ({issue["count"]} tracks)</div>' for issue in validation_results['feature_ranges']['issues']])}
        </div>
        
        <div class="section">
            <h3>Missing Fields</h3>
            <table>
                <tr>
                    <th>Field</th>
                    <th>Missing</th>
                    <th>Percentage</th>
                </tr>
                <tr>
                    <td>BPM</td>
                    <td>{validation_results['missing_fields']['missing_bpm']}</td>
                    <td>{validation_results['missing_fields']['missing_bpm_pct']:.1f}%</td>
                </tr>
                <tr>
                    <td>Energy</td>
                    <td>{validation_results['missing_fields']['missing_energy']}</td>
                    <td>{validation_results['missing_fields']['missing_energy_pct']:.1f}%</td>
                </tr>
                <tr>
                    <td>Key</td>
                    <td>{validation_results['missing_fields']['missing_key']}</td>
                    <td>{validation_results['missing_fields']['missing_key_pct']:.1f}%</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h3>Rating Distribution</h3>
            <table>
                <tr>
                    <th>Rating</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
                {"".join([f'<tr><td>{rating} stars</td><td>{count}</td><td>{(count/analysis_results["tracks"]["rated_tracks"]*100):.1f}%</td></tr>' for rating, count in sorted(analysis_results['tracks']['rating_distribution']['by_rating'].items())])}
            </table>
        </div>
        
        <div class="section">
            <h3>Data Gaps</h3>
            <div class="issue">
                Need {max(0, 1000 - analysis_results['tracks']['rated_tracks'])} more ratings to reach 1000 target
            </div>
            <div class="issue">
                {validation_results['missing_fields']['missing_energy']} tracks missing energy features
            </div>
        </div>
        
        <h2>Recommendations</h2>
        <div class="section">
            <ul>
                <li>Run batch feature extraction to fill missing features</li>
                <li>Collect more ratings using rating collection script</li>
                <li>Fix feature range issues in affected tracks</li>
                <li>Validate relationships and fix orphaned records</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    logger.info(f"Quality report saved to: {output_file}")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate SERGIK ML data quality report"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/analysis/quality_report.html"),
        help="Output HTML file (default: data/analysis/quality_report.html)"
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("GENERATING DATA QUALITY REPORT")
    logger.info("=" * 60)
    
    # Run validation
    logger.info("Running validation...")
    validation_results = validate_all()
    
    # Run analysis
    logger.info("Running analysis...")
    analysis_results = {
        "tracks": analyze_tracks(),
        "actions": analyze_actions(),
        "emotions": analyze_emotions(),
    }
    
    # Generate report
    logger.info("Generating HTML report...")
    generate_html_report(validation_results, analysis_results, args.output)
    
    logger.info("=" * 60)
    logger.info("REPORT GENERATION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Report saved to: {args.output}")
    logger.info(f"Data quality score: {validation_results['summary']['data_quality_score']}/100")


if __name__ == "__main__":
    main()

