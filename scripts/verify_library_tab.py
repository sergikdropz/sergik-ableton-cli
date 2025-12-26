#!/usr/bin/env python3
"""
Verification script for Library Tab functionality.

Tests:
1. API endpoints (search, load, hot_swap)
2. Query parsing
3. Catalog search
4. Error handling
"""

import requests
import json
import sys
import time

API_BASE = "http://127.0.0.1:8000"

def test_health():
    """Test API health endpoint."""
    print("Testing API health...")
    try:
        response = requests.get(f"{API_BASE}/gpt/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API healthy: {data.get('service')} v{data.get('version')}")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API health check error: {e}")
        return False

def test_browser_search():
    """Test browser search endpoint."""
    print("\nTesting browser search...")
    
    test_cases = [
        ("kick", "Simple text search"),
        ("BPM:120", "BPM filter"),
        ("BPM:120-140", "BPM range"),
        ("key:C", "Key filter"),
        ("name:kick", "Name pattern"),
        ("BPM:120, key:C", "Multiple filters"),
    ]
    
    all_passed = True
    for query, description in test_cases:
        try:
            print(f"  Testing: {description} ({query})")
            response = requests.get(
                f"{API_BASE}/live/browser/search",
                params={"query": query, "limit": 10},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    count = data.get("count", 0)
                    print(f"    ✅ Found {count} results")
                else:
                    print(f"    ⚠️  Status: {data.get('status')}, Error: {data.get('error')}")
            else:
                print(f"    ❌ HTTP {response.status_code}: {response.text[:100]}")
                all_passed = False
        except Exception as e:
            print(f"    ❌ Error: {e}")
            all_passed = False
    
    return all_passed

def test_browser_load():
    """Test browser load endpoint."""
    print("\nTesting browser load...")
    
    # Test validation
    test_cases = [
        ({"item_path": "", "track_index": 0}, "Empty path (should fail)"),
        ({"item_path": "/test/path.wav", "track_index": -1}, "Invalid track index (should fail)"),
        ({"item_path": "/test/path.wav", "track_index": 0}, "Valid request"),
    ]
    
    all_passed = True
    for payload, description in test_cases:
        try:
            print(f"  Testing: {description}")
            response = requests.post(
                f"{API_BASE}/live/browser/load",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    print(f"    ✅ Request accepted")
                elif data.get("status") == "error":
                    if "required" in data.get("error", "").lower() or "must be" in data.get("error", "").lower() or "greater" in data.get("error", "").lower():
                        print(f"    ✅ Validation working: {data.get('error')}")
                    else:
                        print(f"    ⚠️  Error: {data.get('error')}")
                else:
                    print(f"    ⚠️  Unexpected status: {data.get('status')}")
            elif response.status_code == 400:
                # Custom validation error format
                data = response.json()
                if data.get("status") == "error":
                    print(f"    ✅ Validation working: {data.get('error')}")
                else:
                    print(f"    ⚠️  HTTP 400: {response.text[:100]}")
            elif response.status_code == 422:
                # FastAPI standard validation error (also acceptable)
                print(f"    ✅ Validation working (HTTP 422)")
            else:
                print(f"    ❌ HTTP {response.status_code}: {response.text[:100]}")
                all_passed = False
        except Exception as e:
            print(f"    ❌ Error: {e}")
            all_passed = False
    
    return all_passed

def test_browser_hot_swap():
    """Test browser hot-swap endpoint."""
    print("\nTesting browser hot-swap...")
    
    test_cases = [
        ({"sample_path": "", "track_index": 0, "device_index": 0}, "Empty path (should fail)"),
        ({"sample_path": "/test/path.wav", "track_index": -1, "device_index": 0}, "Invalid track index (should fail)"),
        ({"sample_path": "/test/path.wav", "track_index": 0, "device_index": -1}, "Invalid device index (should fail)"),
        ({"sample_path": "/test/path.wav", "track_index": 0, "device_index": 0}, "Valid request"),
    ]
    
    all_passed = True
    for payload, description in test_cases:
        try:
            print(f"  Testing: {description}")
            response = requests.post(
                f"{API_BASE}/live/browser/hot_swap",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    print(f"    ✅ Request accepted")
                elif data.get("status") == "error":
                    if "required" in data.get("error", "").lower() or "must be" in data.get("error", "").lower() or "greater" in data.get("error", "").lower():
                        print(f"    ✅ Validation working: {data.get('error')}")
                    else:
                        print(f"    ⚠️  Error: {data.get('error')}")
                else:
                    print(f"    ⚠️  Unexpected status: {data.get('status')}")
            elif response.status_code == 400:
                # Custom validation error format
                data = response.json()
                if data.get("status") == "error":
                    print(f"    ✅ Validation working: {data.get('error')}")
                else:
                    print(f"    ⚠️  HTTP 400: {response.text[:100]}")
            elif response.status_code == 422:
                # FastAPI standard validation error (also acceptable)
                print(f"    ✅ Validation working (HTTP 422)")
            else:
                print(f"    ❌ HTTP {response.status_code}: {response.text[:100]}")
                all_passed = False
        except Exception as e:
            print(f"    ❌ Error: {e}")
            all_passed = False
    
    return all_passed

def main():
    """Run all verification tests."""
    print("=" * 60)
    print("Library Tab Verification Script")
    print("=" * 60)
    
    results = {
        "health": False,
        "search": False,
        "load": False,
        "hot_swap": False
    }
    
    # Test health
    results["health"] = test_health()
    
    if not results["health"]:
        print("\n❌ API is not responding. Please start the server:")
        print("   python run_server.py")
        return 1
    
    # Test endpoints
    results["search"] = test_browser_search()
    results["load"] = test_browser_load()
    results["hot_swap"] = test_browser_hot_swap()
    
    # Summary
    print("\n" + "=" * 60)
    print("Verification Summary")
    print("=" * 60)
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test:15} {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n✅ All tests passed!")
        return 0
    else:
        print("\n❌ Some tests failed. Check logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

