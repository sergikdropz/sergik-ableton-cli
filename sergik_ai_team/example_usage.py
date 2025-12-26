#!/usr/bin/env python3
"""
Example: Using SERGIK AI Team for Development Assistance
"""

from dev_helper import ask_agent_sync, get_dev_helper

def main():
    """Example usage of SERGIK AI Team agents."""
    print("🚀 SERGIK AI Team - Development Assistant\n")
    
    # Quick help
    print("=" * 60)
    print("1. Getting Help:")
    print("=" * 60)
    result = ask_agent_sync("help", "DevAssistant")
    print(result)
    print()
    
    # Get suggestions
    print("=" * 60)
    print("2. Code Improvement Suggestions:")
    print("=" * 60)
    result = ask_agent_sync("suggest", "DevAssistant")
    print(result)
    print()
    
    # Get architecture
    print("=" * 60)
    print("3. Architecture Overview:")
    print("=" * 60)
    result = ask_agent_sync("architecture", "DevAssistant")
    print(result)
    print()
    
    # Generate function
    print("=" * 60)
    print("4. Generate Function Template:")
    print("=" * 60)
    result = ask_agent_sync("generate function process_audio", "DevAssistant")
    print(result)
    print()
    
    # Using helper instance
    print("=" * 60)
    print("5. Using Helper Instance:")
    print("=" * 60)
    helper = get_dev_helper()
    result = helper.ask_sync("pattern", "DevAssistant")
    print(result)
    print()

if __name__ == "__main__":
    main()

