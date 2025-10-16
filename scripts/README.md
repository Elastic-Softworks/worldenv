# Scripts Directory

This directory contains utility scripts for the WorldEnv project.

## remove_screenshot_data.py

A Python script to remove large screenshot data from JSON files to prevent memory issues and crashes when processing the data.

### Usage

```bash
python remove_screenshot_data.py <input_file> [output_file]
```

### Examples

```bash
# Clean the hitl-form-input.json file in place
python remove_screenshot_data.py hitl/hitl-form-input.json

# Clean and save to a different file
python remove_screenshot_data.py hitl/hitl-form-input.json hitl/cleaned-input.json
```

### What it does

- Reads JSON files containing form data with screenshot fields
- Sets all `screenshot` fields to `null` instead of removing them (preserves structure)
- Dramatically reduces file size by removing base64 encoded image data
- Reports how many screenshot entries were cleaned
- Maintains proper JSON formatting with indentation

### Why it's needed

The original JSON file contained large base64 encoded screenshots that caused:
- File sizes of several megabytes
- Agent crashes when trying to process the data
- Memory issues during JSON parsing

After cleaning, the file becomes manageable (typically under 100KB) while preserving all non-screenshot data.

### Requirements

- Python 3.x
- No external dependencies (uses only standard library)