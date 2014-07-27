.PHONY: all build watch less
BROWSERIFY=node_modules/.bin/browserify
WATCHIFY=node_modules/.bin/watchify

all: js less

js:
	$(BROWSERIFY) scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug

watch:
	$(WATCHIFY)   scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug -v

less:
	lessc styles/index.less styles/bundle.css
