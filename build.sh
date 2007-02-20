#! /bin/sh

# Bundle Build Script for MozCC
# (c) 2007, Nathan R. Yergler, Creative Commons
# Licensed to the public; see LICENSE for details

# create XPI files for individual pieces
cd metacore
zip -r ../metacore.xpi *
cd ..

cd mozcc-ui
zip -r ../mozcc-ui.xpi *
cd ..

# create the bundle
zip -r mozcc.xpi install.rdf metacore.xpi mozcc-ui.xpi
