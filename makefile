SHELL := /usr/bin/env bash

.PHONY: help trim trim-dry trim-git trim-test indent indent-dry indent-git indent-test

help:
	@echo "make trim         # Trim trailing whitespace in all files (default)"
	@echo "make trim-dry     # Dry run (show files that would be changed)"
	@echo "make trim-git     # Operate only on git-tracked files"
	@echo "make trim-test    # Run the trimming test (tools/test_trim_trailing_whitespace.sh)"
	@echo ""
	@echo "make indent       # Convert 4-space indent to 2-space (for .js, .html, .css)"
	@echo "make indent-dry   # Dry run for indent conversion"
	@echo "make indent-git   # Operate only on git-tracked files for indent conversion"
	@echo "make indent-test  # Run the indent conversion test (tools/test_convert_indent.sh)"


prettier:
	@./node_modules/.bin/prettier --write "assets/js/**/*.js" "assets/css/**/*.css"
