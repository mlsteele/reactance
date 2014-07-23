.PHONY: build watch
BROWSERIFY=node_modules/.bin/browserify
WATCHIFY=node_modules/.bin/watchify

build:
	$(BROWSERIFY) scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug

watch:
	$(WATCHIFY)   scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug -v

less:
	lessc styles/index.less styles/bundle.css
