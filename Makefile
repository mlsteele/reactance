.PHONY: build watch

build:
	browserify index.js --transform reactify --outfile bundle.js --debug

watch:
	watchify index.js --transform reactify --outfile bundle.js --debug

less:
	lessc styles/index.less styles/bundle.css
