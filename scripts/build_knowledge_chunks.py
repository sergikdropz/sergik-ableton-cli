#!/usr/bin/env python3
"""
Build knowledge chunks JSONL for Custom GPT RAG
"""

import json
import re
from pathlib import Path

MAX_CHUNK_CHARS = 2000

def chunk_text(text, max_chars=MAX_CHUNK_CHARS):
    """Split text into chunks, respecting paragraph boundaries"""
    text = text.strip()
    paragraphs = re.split(r'\n\n+', text)
    
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chars:
            current_chunk += para + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def extract_tags(text, filename):
    """Extract relevant tags from content"""
    tags = []
    
    # From filename
    if "quality" in filename.lower():
        tags.extend(["quality", "qc", "standards"])
    if "style" in filename.lower():
        tags.extend(["style", "production"])
    if "workflow" in filename.lower():
        tags.extend(["workflow", "ableton", "templates"])
    if "overview" in filename.lower():
        tags.extend(["overview", "catalog"])
    if "extraction" in filename.lower():
        tags.extend(["data", "extraction", "schema"])
    
    # From content
    if "bpm" in text.lower():
        tags.append("bpm")
    if "stem" in text.lower():
        tags.append("stems")
    if "mastering" in text.lower() or "master" in text.lower():
        tags.append("mastering")
    if "collab" in text.lower():
        tags.append("collaboration")
    
    return list(set(tags))

def main():
    print("=" * 60)
    print("BUILDING KNOWLEDGE CHUNKS")
    print("=" * 60)
    
    knowledge_dir = Path("knowledge")
    output_file = Path("data/chunks/knowledge_chunks.jsonl")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    all_chunks = []
    
    for md_file in sorted(knowledge_dir.glob("*.md")):
        print(f"Processing: {md_file.name}")
        
        text = md_file.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        
        for idx, chunk in enumerate(chunks):
            tags = extract_tags(chunk, md_file.name)
            
            record = {
                "id": f"{md_file.stem}_{idx:04d}",
                "source": md_file.name,
                "title": md_file.stem.replace("_", " ").title(),
                "tags": tags,
                "text": chunk
            }
            all_chunks.append(record)
        
        print(f"  → {len(chunks)} chunks")
    
    # Write JSONL
    with open(output_file, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")
    
    print(f"\n{'=' * 60}")
    print(f"Total chunks: {len(all_chunks)}")
    print(f"Output: {output_file}")
    print("=" * 60)

if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent.parent)
    main()
