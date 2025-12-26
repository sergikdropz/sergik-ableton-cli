#!/usr/bin/env python3
"""
Test SERGIK AI Team Integration
Quick test to verify agents are accessible
"""

def test_imports():
    """Test that all imports work."""
    try:
        from sergik_ai_team import (
            auto_help,
            develop_sync,
            code_review,
            best_practices,
            ask_agent_sync
        )
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False


def test_auto_help():
    """Test auto_help function."""
    try:
        from sergik_ai_team import auto_help
        result = auto_help("help")
        print("✅ auto_help() works")
        print(f"Result preview: {result[:100]}...")
        return True
    except Exception as e:
        print(f"⚠️ auto_help() error: {e}")
        return False


def test_agent_query():
    """Test direct agent query."""
    try:
        from sergik_ai_team import ask_agent_sync
        result = ask_agent_sync("help", "DevAssistant")
        print("✅ ask_agent_sync() works")
        print(f"Result preview: {result[:100]}...")
        return True
    except Exception as e:
        print(f"⚠️ ask_agent_sync() error: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Testing SERGIK AI Team Integration\n")
    
    print("1. Testing imports...")
    imports_ok = test_imports()
    print()
    
    if imports_ok:
        print("2. Testing auto_help()...")
        auto_help_ok = test_auto_help()
        print()
        
        print("3. Testing ask_agent_sync()...")
        agent_ok = test_agent_query()
        print()
        
        if auto_help_ok and agent_ok:
            print("✅ All tests passed! SERGIK AI Team is ready to use.")
        else:
            print("⚠️ Some tests failed, but basic functionality may work.")
    else:
        print("❌ Import tests failed. Check installation.")

