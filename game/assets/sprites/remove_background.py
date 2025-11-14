#!/usr/bin/env python3
"""
Advanced background removal script
Uses multiple techniques for thorough background removal
"""
import sys
import os

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "numpy", "--quiet", "--user"])
    from PIL import Image
    import numpy as np

def remove_background_advanced(input_path, output_path):
    """Remove background using advanced techniques"""
    img = Image.open(input_path)
    img = img.convert('RGBA')
    
    # Convert to numpy array for easier processing
    data = np.array(img)
    
    # Get corner pixels to determine background color
    width, height = img.size
    corners = [
        tuple(data[0, 0, :3]),           # Top-left
        tuple(data[0, width-1, :3]),     # Top-right
        tuple(data[height-1, 0, :3]),   # Bottom-left
        tuple(data[height-1, width-1, :3]) # Bottom-right
    ]
    
    # Find most common corner color (likely the background)
    from collections import Counter
    bg_rgb = Counter(corners).most_common(1)[0][0]
    
    print(f"Detected background color: RGB{bg_rgb}")
    
    # Method 1: Remove exact matches and near-matches with high threshold
    threshold = 70  # Very aggressive threshold
    r, g, b = int(bg_rgb[0]), int(bg_rgb[1]), int(bg_rgb[2])
    
    # Create mask for background pixels
    mask = (
        (np.abs(data[:, :, 0].astype(int) - r) < threshold) &
        (np.abs(data[:, :, 1].astype(int) - g) < threshold) &
        (np.abs(data[:, :, 2].astype(int) - b) < threshold)
    )
    
    # Make background transparent
    data[mask, 3] = 0  # Set alpha to 0 for background pixels
    
    # Method 2: Remove very light colors (white/light gray backgrounds)
    light_threshold = 230
    light_mask = (
        (data[:, :, 0] > light_threshold) &
        (data[:, :, 1] > light_threshold) &
        (data[:, :, 2] > light_threshold)
    )
    data[light_mask, 3] = 0
    
    # Method 3: Remove very dark colors that might be shadows/artifacts
    dark_threshold = 30
    dark_mask = (
        (data[:, :, 0] < dark_threshold) &
        (data[:, :, 1] < dark_threshold) &
        (data[:, :, 2] < dark_threshold)
    )
    # Only remove dark pixels if they're on edges (likely artifacts)
    edge_mask = np.zeros((height, width), dtype=bool)
    edge_mask[0, :] = True  # Top edge
    edge_mask[-1, :] = True  # Bottom edge
    edge_mask[:, 0] = True  # Left edge
    edge_mask[:, -1] = True  # Right edge
    data[edge_mask & dark_mask, 3] = 0
    
    # Method 4: Remove semi-transparent pixels that are close to background (anti-aliasing artifacts)
    semi_transparent = data[:, :, 3] < 180  # Alpha < 70%
    near_bg = (
        (np.abs(data[:, :, 0].astype(int) - r) < 50) &
        (np.abs(data[:, :, 1].astype(int) - g) < 50) &
        (np.abs(data[:, :, 2].astype(int) - b) < 50)
    )
    artifact_mask = semi_transparent & near_bg
    data[artifact_mask, 3] = 0
    
    # Method 5: Flood fill from edges to remove any remaining background
    # This catches any background pixels that weren't caught by color matching
    visited = np.zeros((height, width), dtype=bool)
    queue = []
    
    # Add all edge pixels that match background to queue
    for y in [0, height-1]:
        for x in range(width):
            pixel = data[y, x]
            if (abs(int(pixel[0]) - r) < threshold and 
                abs(int(pixel[1]) - g) < threshold and 
                abs(int(pixel[2]) - b) < threshold):
                queue.append((y, x))
                visited[y, x] = True
    
    for x in [0, width-1]:
        for y in range(height):
            if not visited[y, x]:
                pixel = data[y, x]
                if (abs(int(pixel[0]) - r) < threshold and 
                    abs(int(pixel[1]) - g) < threshold and 
                    abs(int(pixel[2]) - b) < threshold):
                    queue.append((y, x))
                    visited[y, x] = True
    
    # Flood fill from edges
    while queue:
        y, x = queue.pop(0)
        data[y, x, 3] = 0  # Make transparent
        
        # Check neighbors
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if (0 <= ny < height and 0 <= nx < width and not visited[ny, nx]):
                pixel = data[ny, nx]
                if (abs(int(pixel[0]) - r) < threshold and 
                    abs(int(pixel[1]) - g) < threshold and 
                    abs(int(pixel[2]) - b) < threshold):
                    queue.append((ny, nx))
                    visited[ny, nx] = True
    
    # Convert back to PIL Image
    result_img = Image.fromarray(data, 'RGBA')
    
    # Save with optimization
    result_img.save(output_path, 'PNG', optimize=True)
    print(f"✓ Background removed! Saved as {output_path}")

if __name__ == '__main__':
    files_to_process = ['professor-concerned.png', 'professor-thoughtful.png']
    
    for filename in files_to_process:
        if not os.path.exists(filename):
            print(f"Warning: {filename} not found, skipping...")
            continue
        
        print(f"\nProcessing {filename}...")
        remove_background_advanced(filename, filename)
    
    print("\n✓ All backgrounds removed!")
