import os
import shutil

cur_dir = os.path.dirname(__file__)

files = ['index.html', 'App.js', 'ViewConfig.js', 'style.css']
for file in files:
	shutil.copy(os.path.join(cur_dir,'..', 'svgjs-learn', file), os.path.join(cur_dir, file))	