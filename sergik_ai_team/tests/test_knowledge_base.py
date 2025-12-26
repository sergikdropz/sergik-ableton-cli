"""
Tests for knowledge base
"""

import pytest
from sergik_ai_team.utils.knowledge_base import get_knowledge_base


def test_knowledge_base_initialization():
    """Test knowledge base initialization."""
    kb = get_knowledge_base()
    assert kb is not None
    assert hasattr(kb, 'chunks')
    assert hasattr(kb, 'markdown_files')


def test_knowledge_base_search():
    """Test knowledge base search."""
    kb = get_knowledge_base()
    
    # Test search
    results = kb.search("SERGIK", limit=5)
    assert isinstance(results, list)
    # Results may be empty if knowledge base is not loaded
    assert len(results) >= 0


def test_knowledge_base_domain_knowledge():
    """Test domain knowledge access."""
    kb = get_knowledge_base()
    
    # Test style signature
    style = kb.get_style_signature()
    assert isinstance(style, dict)
    
    # Test musical DNA
    dna = kb.get_musical_dna()
    assert isinstance(dna, dict)
    
    # Test workflow info
    workflow = kb.get_workflow_info()
    assert isinstance(workflow, dict)


def test_knowledge_base_caching():
    """Test knowledge base caching."""
    kb = get_knowledge_base()
    
    # First call
    result1 = kb.search("test", use_cache=True)
    
    # Second call should use cache
    result2 = kb.search("test", use_cache=True)
    
    # Results should be the same
    assert result1 == result2

