.PHONY: build watch

build:
	browserify scripts/index.js --transform reactify --outfile scripts/bundle.js --debug

watch:
	watchify scripts/index.js --transform reactify --outfile scripts/bundle.js --debug -v

less:
	lessc styles/index.less styles/bundle.css
