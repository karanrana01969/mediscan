import sys
import os
from PIL import Image

def resize_and_save(src_path, dst_path, size):
    try:
        img = Image.open(src_path)
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        img.save(dst_path)
        print(f"Saved {dst_path} ({size}x{size})")
    except Exception as e:
        print(f"Error saving {dst_path}: {e}")

src_img = "/home/ditsdev/Desktop/karan.rana/Mediscan/mobile/Gemini_Generated_Image_liajhlliajhlliaj.png"
res_dir = "/home/ditsdev/Desktop/karan.rana/Mediscan/mobile/android/app/src/main/res"

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

for density, size in sizes.items():
    density_dir = os.path.join(res_dir, f"mipmap-{density}")
    if not os.path.exists(density_dir):
        os.makedirs(density_dir)
    
    # Save standard icon
    resize_and_save(src_img, os.path.join(density_dir, "ic_launcher.png"), size)
    # Save round icon (for this case we'll just save the same image as the round icon)
    resize_and_save(src_img, os.path.join(density_dir, "ic_launcher_round.png"), size)

print("Icons updated successfully!")
