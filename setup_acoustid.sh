#!/bin/bash
# Quick setup script for AcoustID API key

echo "SERGIK AI - AcoustID API Key Setup"
echo "==================================="
echo ""
echo "Get your free API key from: https://acoustid.org/api-key"
echo ""
read -p "Enter your AcoustID API key: " api_key

if [ -z "$api_key" ]; then
    echo "No API key provided. Exiting."
    exit 1
fi

# Add to .zshrc (macOS default) or .bashrc
if [ -f ~/.zshrc ]; then
    echo "" >> ~/.zshrc
    echo "# SERGIK AI - AcoustID API Key" >> ~/.zshrc
    echo "export ACOUSTID_API_KEY=\"$api_key\"" >> ~/.zshrc
    echo "✓ Added to ~/.zshrc"
    echo "Run: source ~/.zshrc"
elif [ -f ~/.bashrc ]; then
    echo "" >> ~/.bashrc
    echo "# SERGIK AI - AcoustID API Key" >> ~/.bashrc
    echo "export ACOUSTID_API_KEY=\"$api_key\"" >> ~/.bashrc
    echo "✓ Added to ~/.bashrc"
    echo "Run: source ~/.bashrc"
fi

# Also create/update .env file
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "ACOUSTID_API_KEY=$api_key" > .env
else
    if grep -q "ACOUSTID_API_KEY" .env; then
        sed -i '' "s/ACOUSTID_API_KEY=.*/ACOUSTID_API_KEY=$api_key/" .env
    else
        echo "ACOUSTID_API_KEY=$api_key" >> .env
    fi
fi
echo "✓ Updated .env file"

echo ""
echo "Setup complete! The API key will be available in new terminal sessions."
echo "For current session, run: export ACOUSTID_API_KEY=\"$api_key\""
