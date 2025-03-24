#!/bin/bash

# Script to add Jest global declarations to all test files
# This will add the global declaration to the top of each test file if it doesn't already have it

find . -name "*.test.js" | while read file; do
  # Check if the file already has a global declaration
  if ! grep -q "global.*jest\|global.*expect\|global.*describe" "$file"; then
    echo "Adding global declarations to $file"
    # Create a temporary file with the global declaration and the original content
    (echo "/* global jest, describe, beforeEach, afterEach, it, expect, test */" && echo "" && cat "$file") > "$file.tmp"
    # Replace the original file with the temporary file
    mv "$file.tmp" "$file"
  else
    echo "Skipping $file - already has global declarations"
  fi
done

echo "Done adding global declarations to test files"
