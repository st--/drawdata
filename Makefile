.PHONY: js

install: 
	# install the build tool for JS written in Golang
	curl -fsSL https://esbuild.github.io/dl/v0.19.11 | sh
	uv pip install -e .
	uv pip install twine wheel jupyterlab marimo

pypi:
	python setup.py sdist
	python setup.py bdist_wheel --universal
	twine upload dist/*

js:
	./esbuild --watch=forever --bundle --format=esm --outfile=drawdata/static/bar_widget.js js/bar_widget.js

clean:
	rm -rf .ipynb_checkpoints build dist drawdata.egg-info