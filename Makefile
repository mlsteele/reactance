.PHONY: all build watch less less-long watch-less
BROWSERIFY=node_modules/.bin/browserify
WATCHIFY=node_modules/.bin/watchify
NODEMON=node_modules/.bin/nodemon
LESSC=node_modules/.bin/lessc

all: js less

clean:
	rm -f scripts/bundle.js
	rm -f scripts/bundle.css

js:
	$(BROWSERIFY) scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug

watch-js:
	$(WATCHIFY)   scripts/index.js --transform reactify --transform es6ify --outfile scripts/bundle.js --debug -v

less:
	$(LESSC) styles/index.less styles/bundle.css

# this target exists because nodeomon can't handle short-running tasks.
less-long: less
	sleep 999999999

watch-less:
	$(NODEMON) --watch styles/*.less --exec "make less-long"

watch:
	./together "make watch-js" "make watch-less"

deploy-here:
	git fetch
	git checkout -f origin/master
	make all
