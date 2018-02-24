cd src
rm -rf dist
echo --- python setup.py sdist
python setup.py sdist
echo --- setup.py bdist_wheel --universal
python setup.py bdist_wheel --universal
echo --- twine upload dist/* --skip-existing
twine upload dist/* --skip-existing
