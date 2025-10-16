#!/usr/bin/env python3
"""
Script to remove screenshot data from hitl-form-input.json
This removes the large base64 encoded screenshot strings that are causing
the agent to crash when trying to read the JSON file.
"""

import json
import sys
import os


def remove_screenshots_from_json(input_file, output_file=None):
    """
    Remove screenshot fields from JSON file to reduce file size

    Args:
        input_file (str): Path to input JSON file
        output_file (str): Path to output JSON file (optional, defaults to input_file)
    """
    if output_file is None:
        output_file = input_file

    try:
        # Read the JSON file
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Track removals
        removed_count = 0

        # If data is a list of objects
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and "screenshot" in item:
                    if item["screenshot"] is not None:
                        removed_count += 1
                    item["screenshot"] = None

        # If data is a single object
        elif isinstance(data, dict):
            if "screenshot" in data:
                if data["screenshot"] is not None:
                    removed_count += 1
                data["screenshot"] = None

        # Write the cleaned JSON back to file
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Successfully processed {input_file}")
        print(f"Removed {removed_count} screenshot entries")
        print(f"Output written to {output_file}")

    except FileNotFoundError:
        print(f"Error: File {input_file} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {input_file}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing file: {e}")
        sys.exit(1)


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python remove_screenshot_data.py <input_file> [output_file]")
        print("Example: python remove_screenshot_data.py hitl/hitl-form-input.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)

    remove_screenshots_from_json(input_file, output_file)


if __name__ == "__main__":
    main()
