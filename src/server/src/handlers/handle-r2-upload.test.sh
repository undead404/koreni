#!/bin/bash

# Default API URL
API_URL=${1:-"http://localhost:3000/api/r2-upload"}
PROJECT_ID=${2:-"test-project-id"}

echo "Using API URL: $API_URL"
echo "Using Project ID: $PROJECT_ID"

# Create a temporary dummy file with .jpg extension
TEST_JPEG="temp_test_image.jpg"
echo "Creating dummy JPG file..."
echo "dummy-jpeg-content" > "$TEST_JPEG"

echo "Uploading via multipart form-data (file=temp_test_image.jpg, projectId=$PROJECT_ID)..."
curl -X POST "$API_URL" \
  -F "projectId=$PROJECT_ID" \
  -F "file=@$TEST_JPEG;type=image/jpeg" \
  -i

echo -e "\n\nUploading via multipart form-data with image instead of file (image=temp_test_image.jpg)..."
curl -X POST "$API_URL?projectId=$PROJECT_ID" \
  -F "image=@$TEST_JPEG;type=image/jpeg" \
  -i

# Clean up
echo -e "\nCleaning up temporary files..."
rm -f "$TEST_JPEG"
