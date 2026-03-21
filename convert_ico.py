import cairosvg
from PIL import Image
import os

svg_path = '/home/yuan/my_project/yellow-y.svg'
png_path = '/home/yuan/my_project/yellow-y.png'
ico_path = '/home/yuan/my_project/custom-favicon.ico'

# Convert SVG to PNG (favicons need a base raster image)
cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=256, output_height=256)

# Convert PNG to ICO
img = Image.open(png_path)
img.save(ico_path, format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])

print(f"Successfully generated {ico_path}")
